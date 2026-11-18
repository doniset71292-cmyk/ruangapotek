import { QRCodeSVG } from 'qrcode.react';

export default function CetakBarcodeSuhu() {
  const base = 'https://ruangapotek.vercel.app/suhu';
  const list = [
    { ruangan: 'Ruang Racik', link: `${base}?apotek=Klinik Pratama Yakrija&ruangan=Ruang Racik` },
    { ruangan: 'Gudang Obat', link: `${base}?apotek=Klinik Pratama Yakrija&ruangan=Gudang Obat` },
  ];
  return (
    <div style={{ display: 'flex', gap: 20, padding: 20, fontFamily: 'system-ui', flexWrap: 'wrap' }}>
      {list.map((item) => (
        <div key={item.ruangan} style={{ width: 300, border: '2px solid #0F766E', borderRadius: 16, padding: 20, textAlign: 'center', background: 'white' }}>
          <img src="/yakrija.png" style={{ width: 50, objectFit: 'contain' }} />
          <h3 style={{ margin: '8px 0 2px' }}>SCAN UNTUK LAPOR SUHU</h3>
          <p style={{ margin: 0, fontWeight: 800, color: '#B91C1C' }}>{item.ruangan} • Klinik Pratama Yakrija</p>
          <div style={{ margin: '16px 0', alignItems: 'center', justifyContent: 'center', display: 'flex' }}><QRCodeSVG value={item.link} size={180} /></div>
          <p style={{ fontSize: 12, color: '#64748B' }}>Scan tiap ganti shift<br/>Pagi • Siang • Malam</p>
          <p style={{ fontSize: 10, color: '#94A3B8' }}>{item.link}</p>
        </div>
      ))}
    </div>
  );
}