'use client';

import { useMemo, useState } from 'react';
import { Activity, RefreshCw, TrendingUp } from 'lucide-react';

const PRESETS = {
  'AI': 'NVDA AMD AVGO MU SMCI ARM CRDO ALAB MRVL ANET ORCL PLTR TEM RXRX',
  'Quantum': 'IONQ RGTI QBTS QUBT ARQQ IBM GOOGL MSFT',
  'Space': 'RKLB LUNR ASTS RDW PL SPIR BA LMT NOC',
  '<$10 Watchlist': 'RXT SOUN BBAI SERV KULR RCAT OPTT MVST JOBY ACHR',
  'พอร์ตฉัน': 'VOO QQQM RKLB OKLO NVDA IONQ TEM'
};

const fmt = (n, d = 2) => n === null || n === undefined || Number.isNaN(n) ? '-' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const money = (n) => n === null || n === undefined || Number.isNaN(n) ? '-' : `$${Number(n).toFixed(2)}`;
const pct = (n) => n === null || n === undefined || Number.isNaN(n) ? '-' : `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
const compact = (n) => n === null || n === undefined || Number.isNaN(n) ? '-' : Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n);

export default function Home() {
  const [tickers, setTickers] = useState(PRESETS['<$10 Watchlist']);
  const [filters, setFilters] = useState({ minPrice: 0, maxPrice: 9999, minVolume: 100000, minRvol: 0, minPremarketPct: 0 });
  const [rows, setRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function scan() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers, filters })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setRows(data.rows || []);
      setUpdatedAt(data.updatedAt || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const gainers = rows.filter(r => (r.premarketPct ?? 0) > 0).length;
    const highRvol = rows.filter(r => (r.rvol ?? 0) >= 2).length;
    const top = rows[0]?.symbol || '-';
    return { count: rows.length, gainers, highRvol, top };
  }, [rows]);

  function updateFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  return (
    <main className="page">
      <div className="shell">
        <section className="hero">
          <div>
            <div className="badge"><Activity size={16} /> LIVE STOCK SCANNER</div>
            <h1>Stock Scanner Pro</h1>
            <p className="subtitle">สแกนหุ้นรายวัน: Volume เยอะ, RVOL สูง, และราคาก่อนตลาดเปิดขึ้นกี่เปอร์เซ็นต์ เหมาะสำหรับหาตัวมีแรงก่อนตลาดเปิด</p>
          </div>
          <button className="primary" onClick={scan} disabled={loading}>
            {loading ? <RefreshCw size={16} /> : <TrendingUp size={16} />} {loading ? 'กำลังสแกน...' : 'Scan Now'}
          </button>
        </section>

        <section className="card controls">
          <div>
            <label>ใส่ Ticker คั่นด้วยเว้นวรรคหรือ comma</label>
            <textarea value={tickers} onChange={e => setTickers(e.target.value)} placeholder="เช่น NVDA AMD CRDO RXT TEM RKLB" />
            <div className="presets">
              {Object.entries(PRESETS).map(([name, value]) => (
                <button key={name} className="preset" onClick={() => setTickers(value)}>{name}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="grid">
              <div><label>Min Price</label><input type="number" value={filters.minPrice} onChange={e => updateFilter('minPrice', e.target.value)} /></div>
              <div><label>Max Price</label><input type="number" value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)} /></div>
              <div><label>Min Volume</label><input type="number" value={filters.minVolume} onChange={e => updateFilter('minVolume', e.target.value)} /></div>
              <div><label>Min RVOL</label><input type="number" step="0.1" value={filters.minRvol} onChange={e => updateFilter('minRvol', e.target.value)} /></div>
              <div><label>Min Premarket %</label><input type="number" step="0.1" value={filters.minPremarketPct} onChange={e => updateFilter('minPremarketPct', e.target.value)} /></div>
            </div>
            <div className="actions">
              <button onClick={() => setFilters({ minPrice: 0, maxPrice: 10, minVolume: 500000, minRvol: 1.5, minPremarketPct: 2 })}>เด้งแรง &lt;$10</button>
              <button onClick={() => setFilters({ minPrice: 0, maxPrice: 9999, minVolume: 1000000, minRvol: 2, minPremarketPct: 0 })}>Volume แปลก</button>
              <button onClick={() => setFilters({ minPrice: 0, maxPrice: 9999, minVolume: 0, minRvol: 0, minPremarketPct: -999 })}>ล้าง Filter</button>
            </div>
            {error && <p className="err">{error}</p>}
          </div>
        </section>

        <section className="stats">
          <div className="card stat"><label>ผลลัพธ์</label><div className="num">{stats.count}</div></div>
          <div className="card stat"><label>ตัวที่บวก</label><div className="num pos">{stats.gainers}</div></div>
          <div className="card stat"><label>RVOL ≥ 2</label><div className="num warn">{stats.highRvol}</div></div>
          <div className="card stat"><label>ตัวนำ</label><div className="num">{stats.top}</div></div>
        </section>

        <section className="card tableWrap">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Price</th>
                <th>Pre/Post Price</th>
                <th>Premarket %</th>
                <th>Day %</th>
                <th>Volume</th>
                <th>Avg Vol 30D</th>
                <th>RVOL</th>
                <th>Market</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', color: '#97a3ba', padding: 32 }}>กด Scan Now เพื่อเริ่มสแกน</td></tr>
              ) : rows.map(r => (
                <tr key={r.symbol}>
                  <td><div className="ticker">{r.symbol}</div><div className="name">{r.name || r.exchange}</div></td>
                  <td>{money(r.price)}</td>
                  <td>{money(r.prePostPrice)}</td>
                  <td className={(r.premarketPct ?? 0) >= 0 ? 'pos' : 'neg'}>{pct(r.premarketPct)}</td>
                  <td className={(r.dayChangePct ?? 0) >= 0 ? 'pos' : 'neg'}>{pct(r.dayChangePct)}</td>
                  <td>{compact(r.volumeToday)}</td>
                  <td>{compact(r.avgVol30)}</td>
                  <td className={(r.rvol ?? 0) >= 2 ? 'warn' : ''}>{fmt(r.rvol, 2)}x</td>
                  <td>{r.marketState || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="footer">อัปเดตล่าสุด: {updatedAt ? new Date(updatedAt).toLocaleString() : '-'} | ข้อมูลจาก Yahoo Finance unofficial endpoint อาจดีเลย์หรือบางช่วงไม่มี premarket data ใช้เพื่อคัดกรองเบื้องต้น ไม่ใช่คำแนะนำการลงทุน</p>
      </div>
    </main>
  );
}
