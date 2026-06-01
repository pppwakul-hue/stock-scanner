export const dynamic = 'force-dynamic';

const YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart';

function safeNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function pct(now, base) {
  if (!safeNum(now) || !safeNum(base) || base === 0) return null;
  return ((now - base) / base) * 100;
}

async function yahooChart(symbol, range = '1d', interval = '1m', includePrePost = true) {
  const url = `${YAHOO}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=${includePrePost}`;
  const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Yahoo error ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('No chart data');
  return result;
}

function lastValid(arr) {
  if (!Array.isArray(arr)) return null;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (safeNum(arr[i])) return arr[i];
  }
  return null;
}

async function scanSymbol(symbol) {
  const [intraday, daily] = await Promise.all([
    yahooChart(symbol, '1d', '1m', true),
    yahooChart(symbol, '3mo', '1d', false).catch(() => null)
  ]);

  const meta = intraday.meta || {};
  const quote = intraday.indicators?.quote?.[0] || {};
  const prices = quote.close || [];
  const vols = quote.volume || [];

  const price = safeNum(meta.regularMarketPrice) ?? lastValid(prices);
  const prevClose = safeNum(meta.chartPreviousClose) ?? safeNum(meta.previousClose);
  const prePostPrice = safeNum(meta.preMarketPrice) ?? safeNum(meta.postMarketPrice) ?? price;
  const premarketPct = pct(prePostPrice, prevClose);
  const dayChangePct = pct(price, prevClose);
  const volumeToday = vols.reduce((sum, v) => sum + (safeNum(v) ? v : 0), 0);

  let avgVol30 = null;
  if (daily) {
    const dvols = daily.indicators?.quote?.[0]?.volume || [];
    const valid = dvols.filter(v => safeNum(v) && v > 0).slice(-30);
    if (valid.length) avgVol30 = valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  const rvol = avgVol30 ? volumeToday / avgVol30 : null;

  return {
    symbol: symbol.toUpperCase(),
    name: meta.longName || meta.shortName || '',
    exchange: meta.exchangeName || meta.fullExchangeName || '',
    currency: meta.currency || 'USD',
    price,
    prevClose,
    prePostPrice,
    premarketPct,
    dayChangePct,
    volumeToday,
    avgVol30,
    rvol,
    marketState: meta.marketState || '',
    regularMarketTime: meta.regularMarketTime || null
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const tickers = String(body?.tickers || '')
      .split(/[\s,]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 80);

    const filters = body?.filters || {};
    if (!tickers.length) {
      return Response.json({ error: 'กรุณาใส่ ticker อย่างน้อย 1 ตัว' }, { status: 400 });
    }

    const settled = await Promise.allSettled(tickers.map(scanSymbol));
    let rows = settled
      .filter(x => x.status === 'fulfilled')
      .map(x => x.value);

    const minPrice = Number(filters.minPrice || 0);
    const maxPrice = Number(filters.maxPrice || 999999);
    const minVolume = Number(filters.minVolume || 0);
    const minRvol = Number(filters.minRvol || 0);
    const minPremarketPct = Number(filters.minPremarketPct || -999);

    rows = rows.filter(r => {
      const p = r.price ?? 0;
      const v = r.volumeToday ?? 0;
      const rv = r.rvol ?? 0;
      const pm = r.premarketPct ?? -999;
      return p >= minPrice && p <= maxPrice && v >= minVolume && rv >= minRvol && pm >= minPremarketPct;
    });

    rows.sort((a, b) => ((b.premarketPct ?? -999) - (a.premarketPct ?? -999)) || ((b.volumeToday ?? 0) - (a.volumeToday ?? 0)));

    return Response.json({
      updatedAt: new Date().toISOString(),
      count: rows.length,
      rows,
      failed: settled.filter(x => x.status === 'rejected').length
    });
  } catch (err) {
    return Response.json({ error: err.message || 'Scan failed' }, { status: 500 });
  }
}
