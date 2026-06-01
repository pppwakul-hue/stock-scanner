import './globals.css';

export const metadata = {
  title: 'Stock Scanner Pro',
  description: 'Daily stock scanner: premarket %, volume, RVOL'
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
