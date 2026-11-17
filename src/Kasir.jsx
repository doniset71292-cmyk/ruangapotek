import React, { useState, useMemo, useEffect } from 'react';

const OBAT_AWAL = [
  { id: 1, nama: 'Paracetamol 500mg', kategori: 'Demam', harga: 5000, stok: 120, exp: '12/2027' },
  { id: 2, nama: 'Amoxicillin 500mg', kategori: 'Antibiotik', harga: 15000, stok: 18, exp: '02/2027' },
  { id: 3, nama: 'Promag Tablet', kategori: 'Lambung', harga: 8000, stok: 45, exp: '08/2027' },
  { id: 4, nama: 'Bodrex Extra', kategori: 'Demam', harga: 6000, stok: 80, exp: '10/2027' },
  { id: 5, nama: 'Tolakangin Cair', kategori: 'Herbal', harga: 12000, stok: 30, exp: '05/2027' },
  { id: 6, nama: 'Betadine 60ml', kategori: 'Luka', harga: 18000, stok: 12, exp: '11/2026' },
];

export default function Kasir() {
  const [halaman, setHalaman] = useState('kasir');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [obats, setObats] = useState(() => {
    const s = localStorage.getItem('ruangapotek_obats');
    return s ? JSON.parse(s) : OBAT_AWAL;
  });
  const [transaksis, setTransaksis] = useState(() => {
    const s = localStorage.getItem('ruangapotek_transaksi');
    return s ? JSON.parse(s) : [];
  });
  const [cart, setCart] = useState([]);
  const [cari, setCari] = useState('');
  const [bayar, setBayar] = useState('');
  const [strukTerakhir, setStrukTerakhir] = useState(null);
  const [detailTransaksi, setDetailTransaksi] = useState(null);

  // Form Tambah Obat
  const [formObat, setFormObat] = useState({ nama: '', kategori: 'Demam', harga: '', stok: '', exp: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { localStorage.setItem('ruangapotek_obats', JSON.stringify(obats)); }, [obats]);
  useEffect(() => { localStorage.setItem('ruangapotek_transaksi', JSON.stringify(transaksis)); }, [transaksis]);

  const obatTampil = useMemo(() => obats.filter(o => o.nama.toLowerCase().includes(cari.toLowerCase())), [obats, cari]);
  const total = cart.reduce((a, c) => a + c.harga * c.qty, 0);
  const kembalian = bayar ? Number(bayar) - total : 0;

  const tambahKeCart = (obat) => {
    if (obat.stok <= 0) return alert('Stok habis!');
    const ada = cart.find(c => c.id === obat.id);
    if (ada) setCart(cart.map(c => c.id === obat.id ? { ...c, qty: c.qty + 1 } : c));
    else setCart([...cart, { ...obat, qty: 1 }]);
  };

  const checkout = () => {
    if (!cart.length) return alert('Keranjang masih kosong!');
    if (!bayar || Number(bayar) < total) return alert(`Uang kurang! Total Rp ${total.toLocaleString('id-ID')}`);
    const trx = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      tanggal: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      tanggalRaw: new Date().toISOString().slice(0, 10),
      items: cart,
      total, bayar: Number(bayar), kembalian,
    };
    setObats(obats.map(o => {
      const diCart = cart.find(c => c.id === o.id);
      return diCart ? { ...o, stok: o.stok - diCart.qty } : o;
    }));
    setTransaksis([trx, ...transaksis]);
    setStrukTerakhir(trx);
    setCart([]); setBayar('');
  };

  const simpanObatBaru = () => {
    if (!formObat.nama || !formObat.harga || !formObat.stok) return alert('Isi Nama, Harga, Stok dulu!');
    if (editId) {
      setObats(obats.map(o => o.id === editId ? { ...o, nama: formObat.nama, kategori: formObat.kategori, harga: Number(formObat.harga), stok: Number(formObat.stok), exp: formObat.exp || o.exp } : o));
      alert('Obat berhasil diupdate!');
    } else {
      setObats([...obats, { id: Date.now(), nama: formObat.nama, kategori: formObat.kategori, harga: Number(formObat.harga), stok: Number(formObat.stok), exp: formObat.exp || '12/2027' }]);
      alert('Obat baru berhasil ditambah!');
    }
    setFormObat({ nama: '', kategori: 'Demam', harga: '', stok: '', exp: '' });
    setEditId(null); setHalaman('stok');
  };

  // Laporan
  const hariIni = new Date().toISOString().slice(0, 10);
  const trxHariIni = transaksis.filter(t => t.tanggalRaw === hariIni);
  const omsetHariIni = trxHariIni.reduce((a, t) => a + t.total, 0);
  const obatTerlaris = useMemo(() => {
    const map = {};
    transaksis.forEach(t => t.items.forEach(i => { map[i.nama] = (map[i.nama] || 0) + i.qty; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [transaksis]);

  const menu = [
    { id: 'kasir', label: '🛒 Kasir', desc: 'Jualan' },
    { id: 'tambah', label: '➕ Tambah Obat', desc: 'Obat baru' },
    { id: 'stok', label: '📦 Kelola Stok', desc: `${obats.length} obat` },
    { id: 'riwayat', label: '🧾 Riwayat', desc: `${transaksis.length} transaksi` },
    { id: 'laporan', label: '📊 Laporan', desc: 'Omset hari ini' },
  ];

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', boxSizing: 'border-box', fontSize: 14 };
  const btnTeal = { background: '#0D9488', color: 'white', border: 'none', padding: '12px 18px', borderRadius: 999, fontWeight: 800, cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F9F7', fontFamily: 'system-ui, sans-serif', color: '#1e293b' }}>
      {/* SIDEBAR */}
      <div style={{ width: 240, background: 'white', borderRight: '1px solid #E2E8F0', padding: 16, position: 'fixed', top: 0, bottom: 0, left: sidebarOpen ? 0 : -260, zIndex: 50, transition: '0.2s', boxShadow: '0 0 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <div style={{ width: 36, height: 36, background: '#0D9488', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>➕</div>
  <div style={{ lineHeight: 1 }}>
    <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.5 }}>Ruang</div>
    <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.5, color: '#0D9488' }}>Apotek</div>
  </div>
</div>
          <button onClick={() => setSidebarOpen(false)} style={{ border: 'none', background: '#F1F5F9', borderRadius: 999, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {menu.map(m => (
            <button key={m.id} onClick={() => { setHalaman(m.id); setSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: 12, border: 'none', background: halaman === m.id ? '#0D9488' : '#F8FAFC', color: halaman === m.id ? 'white' : '#1e293b', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</span>
              <span style={{ fontSize: 11, opacity: 0.8 }}>{m.desc}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 'auto', background: '#FFFBEB', borderRadius: 12, padding: 12 }}>
          <b style={{ fontSize: 12 }}>⚠️ Obat mau expired</b>
          <p style={{ fontSize: 12, margin: '6px 0 0' }}>{obats.filter(o => o.exp.includes('2026')).length} obat exp 2026. Cek di Kelola Stok.</p>
        </div>
      </div>

      {/* KONTEN */}
      <div style={{ flex: 1, marginLeft: 0, width: '100%', padding: 14, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>☰ Menu</button>
          <span style={{ background: '#FFEDD5', color: '#9A3412', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>● OFFLINE</span>
        </div>

        {/* === HALAMAN KASIR === */}
        {halaman === 'kasir' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
              <h2 style={{ margin: '0 0 12px' }}>Kasir</h2>
              <input value={cari} onChange={e => setCari(e.target.value)} placeholder="🔍 Cari obat... paracetamol" style={{ ...inp, borderRadius: 999, borderColor: '#99F6E4' }} />
              <p style={{ fontSize: 12, color: '#64748B' }}>{obatTampil.length} obat ditemukan • Klik obat untuk masuk keranjang</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {obatTampil.map(o => (
                  <button key={o.id} onClick={() => tambahKeCart(o)} style={{ textAlign: 'left', background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 12, cursor: 'pointer' }}>
                    <span style={{ fontSize: 11, background: '#F1F5F9', padding: '3px 8px', borderRadius: 999 }}>{o.kategori}</span>
                    <div style={{ fontWeight: 700, marginTop: 8, fontSize: 14 }}>{o.nama}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Stok: {o.stok} • Exp: {o.exp}</div>
                    <div style={{ color: '#0D9488', fontWeight: 800, marginTop: 4 }}>Rp {o.harga.toLocaleString('id-ID')}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
              <b>🧾 Keranjang ({cart.reduce((a, c) => a + c.qty, 0)})</b>
              {cart.length === 0 ? <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>Belum ada obat dipilih.<br/>Klik obat di kiri.</p> : cart.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: 14 }}>
                  <span>{c.nama} <span style={{ color: '#94A3B8' }}>x{c.qty}</span></span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <b>Rp {(c.harga * c.qty).toLocaleString('id-ID')}</b>
                    <button onClick={() => setCart(cart.filter(x => x.id !== c.id))} style={{ border: 'none', background: '#FEF2F2', borderRadius: 999, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 18, fontWeight: 800 }}><span>Total</span><span>Rp {total.toLocaleString('id-ID')}</span></div>
              <input value={bayar} onChange={e => setBayar(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Total bayar, contoh: 50000" style={{ ...inp, marginTop: 10, borderRadius: 999 }} />
              {bayar && <p style={{ fontSize: 13 }}>Kembalian: <b style={{ color: kembalian < 0 ? '#DC2626' : '#15803D' }}>Rp {kembalian.toLocaleString('id-ID')}</b></p>}
              <button onClick={checkout} style={{ ...btnTeal, width: '100%', marginTop: 8, padding: 14 }}>BAYAR & CETAK RESEP →</button>
              {strukTerakhir && <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 12, marginTop: 12, fontSize: 13 }}><b>✅ Berhasil! {strukTerakhir.id}</b><br/>Total Rp {strukTerakhir.total.toLocaleString('id-ID')} • Kembalian Rp {strukTerakhir.kembalian.toLocaleString('id-ID')}</div>}
            </div>
          </div>
        )}

        {/* === TAMBAH OBAT === */}
        {halaman === 'tambah' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 20, maxWidth: 520 }}>
            <h2 style={{ marginTop: 0 }}>{editId ? '✏️ Edit Obat' : '➕ Tambah Obat Baru'}</h2>
            <label style={{ fontSize: 12, fontWeight: 700 }}>NAMA OBAT</label><input value={formObat.nama} onChange={e => setFormObat({ ...formObat, nama: e.target.value })} placeholder="Cth: Paracetamol 500mg" style={{ ...inp, margin: '6px 0 12px' }} />
            <label style={{ fontSize: 12, fontWeight: 700 }}>KATEGORI</label>
            <select value={formObat.kategori} onChange={e => setFormObat({ ...formObat, kategori: e.target.value })} style={{ ...inp, margin: '6px 0 12px' }}>
              {['Demam', 'Antibiotik', 'Lambung', 'Herbal', 'Luka', 'Vitamin', 'Batuk', 'Lainnya'].map(k => <option key={k}>{k}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 700 }}>HARGA</label><input value={formObat.harga} onChange={e => setFormObat({ ...formObat, harga: e.target.value.replace(/[^0-9]/g, '') })} placeholder="5000" style={{ ...inp, margin: '6px 0 12px' }} /></div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 700 }}>STOK</label><input value={formObat.stok} onChange={e => setFormObat({ ...formObat, stok: e.target.value.replace(/[^0-9]/g, '') })} placeholder="50" style={{ ...inp, margin: '6px 0 12px' }} /></div>
            </div>
            <label style={{ fontSize: 12, fontWeight: 700 }}>TANGGAL EXPIRED</label><input value={formObat.exp} onChange={e => setFormObat({ ...formObat, exp: e.target.value })} placeholder="MM/YYYY, cth: 12/2027" style={{ ...inp, margin: '6px 0 16px' }} />
            <button onClick={simpanObatBaru} style={{ ...btnTeal, width: '100%' }}>{editId ? 'Simpan Perubahan' : 'Simpan Obat Baru →'}</button>
            {editId && <button onClick={() => { setEditId(null); setFormObat({ nama: '', kategori: 'Demam', harga: '', stok: '', exp: '' }); }} style={{ width: '100%', background: 'white', border: '1px solid #E2E8F0', padding: 12, borderRadius: 999, marginTop: 8, cursor: 'pointer' }}>Batal Edit</button>}
          </div>
        )}

        {/* === KELOLA STOK === */}
        {halaman === 'stok' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0 }}>📦 Kelola Stok Obat</h2><button onClick={() => setHalaman('tambah')} style={btnTeal}>+ Obat Baru</button></div>
            <p style={{ fontSize: 12, color: '#64748B' }}>Total {obats.length} obat • Stok menipis (&lt;20) warna kuning, Expired 2026 warna merah</p>
            {obats.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}><b style={{ fontSize: 14 }}>{o.nama}</b><div style={{ fontSize: 12, color: '#64748B' }}>{o.kategori} • Exp: {o.exp} • Rp {o.harga.toLocaleString('id-ID')}</div></div>
                <span style={{ fontWeight: 800, fontSize: 14, background: o.stok < 20 ? '#FEF3C7' : '#F0FDF4', padding: '6px 10px', borderRadius: 999 }}>Stok: {o.stok}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditId(o.id); setFormObat({ nama: o.nama, kategori: o.kategori, harga: String(o.harga), stok: String(o.stok), exp: o.exp }); setHalaman('tambah'); }} style={{ background: '#EFF6FF', border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>✏️ Edit</button>
                  <button onClick={() => { if (confirm(`Hapus ${o.nama}?`)) setObats(obats.filter(x => x.id !== o.id)); }} style={{ background: '#FEF2F2', border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === RIWAYAT === */}
        {halaman === 'riwayat' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>🧾 Rincian Riwayat Transaksi</h2>
            {transaksis.length === 0 ? <p style={{ color: '#94A3B8' }}>Belum ada transaksi. Coba dulu di Kasir.</p> : transaksis.map(t => (
              <button key={t.id} onClick={() => setDetailTransaksi(t)} style={{ width: '100%', textAlign: 'left', background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                <span><b>{t.id}</b><div style={{ fontSize: 12, color: '#64748B' }}>{t.tanggal} • {t.items.reduce((a, i) => a + i.qty, 0)} item</div></span>
                <b>Rp {t.total.toLocaleString('id-ID')} →</b>
              </button>
            ))}
            {detailTransaksi && (
              <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>Struk {detailTransaksi.id}</b><button onClick={() => setDetailTransaksi(null)} style={{ border: 'none', background: 'white', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>✕ Tutup</button></div>
                <p style={{ fontSize: 12, color: '#64748B' }}>{detailTransaksi.tanggal}</p>
                {detailTransaksi.items.map((i, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}><span>{i.nama} x{i.qty}</span><span>Rp {(i.harga * i.qty).toLocaleString('id-ID')}</span></div>)}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}><span>Total</span><b>Rp {detailTransaksi.total.toLocaleString('id-ID')}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}><span>Bayar</span><span>Rp {detailTransaksi.bayar.toLocaleString('id-ID')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}><span>Kembalian</span><span>Rp {detailTransaksi.kembalian.toLocaleString('id-ID')}</span></div>
                <button onClick={() => window.print()} style={{ ...btnTeal, width: '100%', marginTop: 12 }}>🖨️ Cetak Struk Ini</button>
              </div>
            )}
          </div>
        )}

        {/* === LAPORAN HARIAN === */}
        {halaman === 'laporan' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div style={{ background: 'white', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 12, color: '#64748B' }}>Omset Hari Ini</div><b style={{ fontSize: 22 }}>Rp {omsetHariIni.toLocaleString('id-ID')}</b></div>
              <div style={{ background: 'white', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 12, color: '#64748B' }}>Transaksi Hari Ini</div><b style={{ fontSize: 22 }}>{trxHariIni.length}x</b></div>
              <div style={{ background: 'white', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 12, color: '#64748B' }}>Total Semua Transaksi</div><b style={{ fontSize: 22 }}>{transaksis.length}x</b></div>
            </div>
            <div style={{ background: 'white', borderRadius: 16, padding: 16, marginTop: 12 }}>
              <b>🏆 Obat Paling Laku</b>
              {obatTerlaris.length === 0 ? <p style={{ color: '#94A3B8', fontSize: 13 }}>Belum ada penjualan.</p> : obatTerlaris.map(([nama, qty], i) => (
                <div key={nama} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: 14 }}><span>#{i + 1} {nama}</span><b>{qty} terjual</b></div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: 16, padding: 16, marginTop: 12 }}>
              <b>📋 Transaksi Hari Ini</b>
              {trxHariIni.length === 0 ? <p style={{ color: '#94A3B8', fontSize: 13 }}>Belum ada transaksi hari ini.</p> : trxHariIni.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: 14 }}><span>{t.id} • {t.tanggal}</span><b>Rp {t.total.toLocaleString('id-ID')}</b></div>
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 20 }}>RuangApotek v2.0 • Data tersimpan di HP ini • Offline</p>
      </div>

      {/* OVERLAY HP */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }}></div>}
    </div>
  );
}