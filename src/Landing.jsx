import React, { useState, useEffect } from 'react';

const s = {
  page: { minHeight: '100vh', background: '#F0F9F7', fontFamily: 'system-ui, sans-serif', color: '#1e293b', boxSizing: 'border-box' },
  nav: { maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 14px' },
  logo: { fontWeight: 800, fontSize: 20, color: '#0F766E' },
  navBtn: { background: '#0D9488', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 13 },
  hero: { maxWidth: 1100, margin: '0 auto', padding: '20px 14px 40px', display: 'grid', gap: 20 },
  badge: { display: 'inline-block', background: '#CCFBF1', color: '#0F766E', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 999 },
  h1: { fontSize: 36, lineHeight: 1.15, margin: '14px 0 10px', color: '#042F2E', fontWeight: 800 },
  p: { color: '#475569', lineHeight: 1.6, fontSize: 15 },
  btnPrimary: { background: '#0D9488', color: 'white', border: 'none', padding: '14px 22px', borderRadius: 999, fontWeight: 800, cursor: 'pointer', fontSize: 15, width: '100%' },
  btnSecondary: { background: 'white', border: '1px solid #E2E8F0', padding: '14px 22px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 15, width: '100%' },
  priceBox: { display: 'flex', gap: 16, alignItems: 'center', marginTop: 18 },
  mockup: { background: 'white', borderRadius: 20, padding: 0, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' },
  stat: { padding: 12, borderRadius: 12, fontSize: 12 },
  fiturGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 16 },
  fiturCard: { background: 'white', borderRadius: 18, padding: 18, textAlign: 'center', boxShadow: '0 1px 5px rgba(0,0,0,0.05)' },
  hargaBox: { background: '#0F766E', color: 'white', borderRadius: 24, padding: 24, textAlign: 'center', marginTop: 20 },
  // Style baru buat slider
  sliderWrap: { display: 'flex', transition: 'transform 0.7s ease-in-out' },
  dot: { width: 10, height: 10, borderRadius: 999, border: 'none', cursor: 'pointer' },
  arrowBtn: { width: 36, height: 36, borderRadius: 999, border: 'none', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: '#0F766E' },
};

const slides = [
  {
    id: 1,
    img: '/dashboard-kasir.png',
    label: 'Tampilan Laptop / PC Kasir',
    desc: '↑ Tampilan mode trial. Klik obat, langsung masuk keranjang.',
    type: 'laptop',
  },
  {
    id: 2,
    img: '/hp-kasir.png',
    label: 'Tampilan HP - Kasir',
    desc: '↑ Tampilan di HP. Cari obat, cek stok & Exp, langsung jualan.',
    type: 'hp',
  },
];

export default function LandingRuangApotek({ onCobaKasir }) {
  const [namaApotek, setNamaApotek] = useState("");
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // AUTO SLIDE tiap 4 detik
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const keWA = () => {
    const pesan = `Halo RuangApotek, saya ${namaApotek || 'dari Apotek'} mau daftar paket Rp 699rb/tahun. Boleh demo 5 menit?`;
    window.open(`https://wa.me/628818352063?text=${encodeURIComponent(pesan)}`, '_blank');
  };

  return (
    <div style={s.page}>
      {/* NAV */}
      <div style={s.nav}>
       <div style={{ lineHeight: 1, display: 'inline-block', verticalAlign: 'middle' }}>
  <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1 }}>Ruang</div>
  <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1, color: '#0D9488' }}>Apotek</div>
</div>
        <div style={{display: 'flex', gap: 8}}>
          <button onClick={keWA} style={{...s.navBtn, background: 'white', color: '#0F766E', border: '1px solid #E2E8F0'}}>Chat WA</button>
          <button onClick={onCobaKasir} style={s.navBtn}>Masuk →</button>
        </div>
      </div>

      {/* HERO */}
      <div style={{...s.hero, gridTemplateColumns: window.innerWidth > 800 ? '1.1fr 0.9fr' : '1fr'}}>
        <div>
          <span style={s.badge}>⚡ Hemat 75% untuk Apotek Indonesia</span>
          <h1 style={s.h1}>Jadikan Apotekmu Online,<br/>Kelola Apotek secara Digital</h1>
          <p style={s.p}>Aplikasi kasir & stok untuk Apotek. Cegah kerugian obat kedaluwarsa, pantau laporan harian, kelola penjualan — <b>bisa berjalan mode offline.</b></p>

          <div style={{display: 'flex', flexDirection: window.innerWidth > 600 ? 'row' : 'column', gap: 10, marginTop: 20}}>
            <button onClick={onCobaKasir} style={s.btnPrimary}>Coba Demo Kasir Gratis →</button>
            <button onClick={() => document.getElementById('harga').scrollIntoView({behavior: 'smooth'})} style={s.btnSecondary}>Lihat Harga Promo</button>
          </div>

          <div style={s.priceBox}>
            <div><div style={{fontSize: 11, color: '#64748B'}}>Hanya</div><div style={{fontSize: 30, fontWeight: 800}}>Rp 2.000<span style={{fontSize: 13, fontWeight: 400}}>/hari</span></div></div>
            <div><div style={{textDecoration: 'line-through', color: '#94A3B8'}}>Rp 2.880.000/tahun</div><div style={{fontSize: 12, fontWeight: 700, color: '#0F766E'}}>Hemat Rp 2jt++</div></div>
          </div>
          <p style={{fontSize: 12, color: '#64748B', marginTop: 10}}>✓ Tanpa kartu kredit &nbsp; ✓ Setup 5 menit &nbsp; ✓ Dukungan WA 24 jam</p>
        </div>

        {/* MOCKUP DASHBOARD - AUTO SLIDER */}
        <div 
          style={s.mockup}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div style={{position: 'absolute', top: 12, left: 12, zIndex: 2, background: '#CCFBF1', color: '#0F766E', fontSize: 11, fontWeight: 700, padding: '2px 3px', borderRadius: 999}}>
           {current + 1} / {slides.length}
          </div>

          <div style={{ display: 'flex', width: '100%', transition: 'transform 0.7s ease-in-out', transform: `translateX(-${current * 100}%)` }}>
            {slides.map((slide) => (
              <div key={slide.id} style={{minWidth: '100%', textAlign: 'center'}}>
                <div style={{ 
                height: 360, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                 overflow: 'hidden',
                  borderRadius: 0,
                  margin: 0,
                  padding: 0, 
                            }}>
                <img 
                 src={slide.img} 
                 alt={slide.label} 
                  style={slide.type === 'hp' 
                ? { height: 360, width: 'auto', maxWidth: 210, objectFit: 'cover', objectPosition: 'top', borderRadius: 28, display: 'block', boxShadow: '0 10px 30px rgba(0,0,0,0.18)', border: '4px solid #111827' }
                : { height: 360, width: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: 0, display: 'block', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }
                   } 
                />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F766E', marginTop: 10, marginBottom: 2 }}>{slide.label}</p>
                <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', margin: 0 }}>{slide.desc}</p>
              </div>
            ))}
          </div>
          </div>
        </div>

      {/* FITUR */}
      <div style={{maxWidth: 1100, margin: '0 auto', padding: '0 14px'}}>
        <h2 style={{textAlign: 'center', fontSize: 24, fontWeight: 800}}>Fitur Utama</h2>
        <div style={{...s.fiturGrid, gridTemplateColumns: window.innerWidth > 700 ? '1fr 1fr 1fr' : '1fr'}}>
          <div style={s.fiturCard}><div style={{fontSize: 32}}>🛒</div><h3>Kasir Offline</h3><p style={s.p}>Internet mati? Kasir tetap jalan. Data tersimpan otomatis di PC/HP.</p></div>
          <div style={s.fiturCard}><div style={{fontSize: 32}}>⏰</div><h3>Alert Expired</h3><p style={s.p}>Obat &lt; 90 hari expired langsung merah. Cegah rugi puluhan ribu per strip.</p></div>
          <div style={s.fiturCard}><div style={{fontSize: 32}}>📊</div><h3>Laporan Harian</h3><p style={s.p}>Omset hari ini, obat paling laku, stok menipis — semua dalam 1 layar.</p></div>
        </div>

        {/* HARGA */}
        <div id="harga" style={s.hargaBox}>
          <p style={{fontSize: 12, fontWeight: 700, color: '#99F6E4', margin: 0}}>HARGA SPESIAL LAUNCHING .</p>
          <h2 style={{fontSize: 32, margin: '10px 0 4px'}}>Rp 59.000 / bulan, atau</h2>
          <p style={{color: '#CCFBF1', margin: 0}}>Rp 699.000 / tahun — Bayar sekali, pakai 1 tahun penuh</p>
          <div style={{textAlign: 'left', maxWidth: 380, margin: '18px auto', fontSize: 14, lineHeight: 1.8}}>
            ✓ Semua fitur: Kasir, Stok, Expired, Laporan<br/>
            ✓ Bisa dipakai di HP + PC (1 apotek)<br/>
            ✓ Bisa dipakai tanpa internet<br/>
            ✓ Bantuan setup via WA sampai bisa
          </div>
          <input value={namaApotek} onChange={e => setNamaApotek(e.target.value)} placeholder="Nama apotek kamu, contoh: Apotek Sehat" style={{width: '100%', maxWidth: 380, padding: '12px 14px', borderRadius: 999, border: 'none', outline: 'none', boxSizing: 'border-box'}} />
          <button onClick={keWA} style={{width: '100%', maxWidth: 380, background: 'white', color: '#0F766E', border: 'none', padding: '14px', borderRadius: 999, fontWeight: 800, marginTop: 10, cursor: 'pointer'}}>Daftar Sekarang via WA →</button>
          <p style={{fontSize: 11, color: '#99F6E4', marginTop: 10}}>1 obat expired yang terselamatkan = aplikasi sudah gratis.</p>
        </div>
        <p style={{textAlign: 'center', fontSize: 11, color: '#94A3B8', padding: '20px 0'}}>© 2026 RuangApotek • Dibuat untuk Apotek di seluruh Indonesia</p>
      </div>
    </div>
  );
}