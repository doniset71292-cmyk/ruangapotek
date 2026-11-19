import { useState, useMemo, useEffect } from 'react';
import { supabase } from './supabase';

// ===== HELPER EXPIRED: 12/2027 <-> 2027-12-01 =====
// DB butuh 2027-12-01, tapi di layar kita tampilkan 12/2027
const konversiExpired = (val) => {
  if (!val) return '2027-12-01';
  val = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (/^\d{4}-\d{2}$/.test(val)) return val + '-01';
  const m = val.match(/^(\d{1,2})[\/-](\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, '0')}-01`;
  return '2027-12-01';
};
const tampilExpired = (val) => {
  if (!val) return '-';
  const m = String(val).match(/^(\d{4})-(\d{2})/);
  if (m) return `${m[2]}/${m[1]}`;
  return val;
};

const OBAT_AWAL = [
  { id: 1, nama: 'Paracetamol 500mg', kategori: 'Demam', harga: 5000, stok: 120, exp: '12/2027' },
  { id: 2, nama: 'Amoxicillin 500mg', kategori: 'Antibiotik', harga: 15000, stok: 18, exp: '02/2027' },
  { id: 3, nama: 'Promag Tablet', kategori: 'Lambung', harga: 8000, stok: 45, exp: '08/2027' },
  { id: 4, nama: 'Betadine 60ml', kategori: 'Luka', harga: 18000, stok: 12, exp: '11/2026' },
];

export default function Kasir() {
  const [halaman, setHalaman] = useState('kasir');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [obats, setObats] = useState([]);
  const [loadingObat, setLoadingObat] = useState(true);
  const [transaksis, setTransaksis] = useState(() => {
    const s = localStorage.getItem('ruangapotek_transaksi');
    return s ? JSON.parse(s) : [];
  });
  const [cart, setCart] = useState([]);
  const [cari, setCari] = useState('');
  const [bayar, setBayar] = useState('');
  const [strukTerakhir, setStrukTerakhir] = useState(null);
  const [detailTransaksi, setDetailTransaksi] = useState(null);

  const [formObat, setFormObat] = useState({ nama: '', kategori: 'Demam', harga: '', stok: '', exp: '' });
  const [editId, setEditId] = useState(null);

  // ===== DATA PASIEN (BARU) =====
  const [nik, setNik] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alergi, setAlergi] = useState('');
  const [pasienLama, setPasienLama] = useState(null);
  const [listPasien, setListPasien] = useState([]);
  const [cariPasienInput, setCariPasienInput] = useState('');

  const [poList, setPoList] = useState(() => {
    const s = localStorage.getItem('ruangapotek_po');
    return s ? JSON.parse(s) : [];
  });
  const [poForm, setPoForm] = useState({ noFaktur: '', supplier: 'PT. Kimia Farma Trading', jatuhTempo: '', items: [{ nama: '', qty: 1, hargaBeli: '', exp: '' }] });

  const [logSuhu, setLogSuhu] = useState([]);
  const [filterSuhu, setFilterSuhu] = useState('Semua');

  // ===== LOAD OBAT DARI SUPABASE =====
  const loadObats = async () => {
    setLoadingObat(true);
    const { data, error } = await supabase.from('obat').select('*').order('nama');
    if (error) {
      console.error(error);
      setObats(OBAT_AWAL);
    } else if (!data || data.length === 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const toInsert = OBAT_AWAL.map(o => ({ nama: o.nama, kategori: o.kategori, harga: o.harga, stok: o.stok, expired: konversiExpired(o.exp), apotek_id: user.id }));
        await supabase.from('obat').insert(toInsert);
        const { data: data2 } = await supabase.from('obat').select('*').order('nama');
        setObats((data2 || []).map(d => ({ ...d, exp: tampilExpired(d.expired) })));
      } else {
        setObats(OBAT_AWAL);
      }
    } else {
      setObats(data.map(d => ({ ...d, exp: tampilExpired(d.expired) })));
    }
    setLoadingObat(false);
  };

  const loadSuhu = async () => {
    const { data } = await supabase.from('log_suhu').select('*').order('created_at', { ascending: false });
    if (data) setLogSuhu(data);
  };

  const loadPasien = async () => {
    const { data } = await supabase.from('pasien').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) setListPasien(data);
  };

  useEffect(() => { loadObats(); loadSuhu(); loadPasien(); }, []);
  useEffect(() => { localStorage.setItem('ruangapotek_transaksi', JSON.stringify(transaksis)); }, [transaksis]);
  useEffect(() => { localStorage.setItem('ruangapotek_po', JSON.stringify(poList)); }, [poList]);

  // ===== CARI PASIEN OTOMATIS PAS KETIK NIK =====
  const cariPasien = async (nikInput) => {
    const bersih = nikInput.replace(/\D/g, '').slice(0, 16);
    setNik(bersih);
    if (bersih.length === 16) {
      const { data } = await supabase.from('pasien').select('*').eq('nik', bersih).single();
      if (data) {
        setNamaPasien(data.nama || '');
        setNoHp(data.no_hp || '');
        setAlergi(data.alergi || '');
        setPasienLama(data);
      } else {
        setPasienLama(null);
        setNamaPasien('');
        setNoHp('');
        setAlergi('');
      }
    } else {
      setPasienLama(null);
    }
  };

  const obatTampil = useMemo(() => obats.filter(o => o.nama.toLowerCase().includes(cari.toLowerCase())), [obats, cari]);
  const total = cart.reduce((a, c) => a + c.harga * c.qty, 0);
  const kembalian = bayar ? Number(bayar) - total : 0;

  const tambahKeCart = (obat) => {
    if (obat.stok <= 0) return alert('Stok habis!');
    const ada = cart.find(c => c.id === obat.id);
    if (ada) setCart(cart.map(c => c.id === obat.id ? { ...c, qty: c.qty + 1 } : c));
    else setCart([...cart, { ...obat, qty: 1 }]);
  };

  // ===== CHECKOUT - UDAH ASYNC, TINGGAL TAMBAH PASIEN =====
  const checkout = async () => {
    if (!cart.length) return alert('Keranjang masih kosong!');
    if (!bayar || Number(bayar) < total) return alert(`Uang kurang! Total Rp ${total.toLocaleString('id-ID')}`);

    // Kalau ada NIK, wajib 16 digit + nama, simpan pasien dulu
    if (nik) {
      if (nik.length !== 16) return alert('NIK harus 16 digit!');
      if (!namaPasien) return alert('Isi nama pasien dulu!');
      const { error: errPasien } = await supabase.from('pasien').upsert({
        nik: nik,
        nama: namaPasien,
        no_hp: noHp || null,
        alergi: alergi || null,
      }, { onConflict: 'nik' });
      if (errPasien) return alert('Gagal simpan pasien: ' + errPasien.message);
      loadPasien();
    }

    const trx = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      tanggal: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      tanggalRaw: new Date().toISOString().slice(0, 10),
      items: cart,
      total, bayar: Number(bayar), kembalian,
      pasien_nik: nik || null,
      pasien_nama: namaPasien || null,
    };

    // Simpan ke Supabase tabel transaksi (kalau tabelnya ada, kalau belum ada di-ignore biar gak error)
    try {
      await supabase.from('transaksi').insert([{
        pasien_nik: nik || null,
        pasien_nama: namaPasien || null,
        total_harga: total,
        items: cart.map(c => ({ id: c.id, nama: c.nama, harga: c.harga, qty: c.qty })),
        metode_bayar: 'tunai',
      }]);
    } catch (e) { console.log('Transaksi supabase skip:', e); }

    // Kurangi stok di Supabase
    for (const c of cart) {
      const obatBaru = obats.find(o => o.id === c.id);
      if (obatBaru) {
        await supabase.from('obat').update({ stok: obatBaru.stok - c.qty }).eq('id', c.id);
      }
    }
    setObats(obats.map(o => {
      const diCart = cart.find(c => c.id === o.id);
      return diCart ? { ...o, stok: o.stok - diCart.qty } : o;
    }));
    setTransaksis([trx, ...transaksis]);
    setStrukTerakhir(trx);
    setCart([]); setBayar('');
    setNik(''); setNamaPasien(''); setNoHp(''); setAlergi(''); setPasienLama(null);
  };

  const simpanObatBaru = async () => {
    if (!formObat.nama || !formObat.harga || !formObat.stok) return alert('Isi Nama, Harga, Stok dulu!');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Harus login dulu!');
    // FIX EXPIRED: formObat.exp bisa 12/2027 atau 2027-12 atau 2027-12-01, kita convert dulu
    const payload = { nama: formObat.nama, kategori: formObat.kategori, harga: Number(formObat.harga), stok: Number(formObat.stok), expired: konversiExpired(formObat.exp || '12/2027'), apotek_id: user.id };
    if (editId) {
      const { error } = await supabase.from('obat').update(payload).eq('id', editId);
      if (error) return alert(error.message);
      alert('Obat berhasil diupdate!');
    } else {
      const { error } = await supabase.from('obat').insert([payload]);
      if (error) return alert(error.message);
      alert('Obat baru berhasil ditambah!');
    }
    setFormObat({ nama: '', kategori: 'Demam', harga: '', stok: '', exp: '' });
    setEditId(null); setHalaman('stok');
    loadObats();
  };

  const hapusObat = async (obat) => {
    if (!confirm(`Hapus ${obat.nama}?`)) return;
    await supabase.from('obat').delete().eq('id', obat.id);
    loadObats();
  };

  const simpanPO = async () => {
    if (!poForm.noFaktur) return alert('Isi No. Faktur dulu!');
    if (!poForm.items[0].nama) return alert('Isi minimal 1 obat!');
    const totalPO = poForm.items.reduce((s, it) => s + (Number(it.qty) * Number(it.hargaBeli || 0)), 0);
    const poBaru = { ...poForm, tanggal: new Date().toLocaleDateString('id-ID'), total: totalPO, status: 'BELUM LUNAS', id: Date.now() };
    setPoList([poBaru, ...poList]);

    const { data: { user } } = await supabase.auth.getUser();
    let obatsBaru = [...obats];
    for (const it of poForm.items) {
      const idx = obatsBaru.findIndex(o => o.nama.toLowerCase() === it.nama.toLowerCase());
      // FIX: it.exp dari input type=date = 2027-12-01, langsung bisa dipakai, kalau kosong pakai default
      const expBaruDB = it.exp ? konversiExpired(it.exp) : '2027-12-01';
      const expBaruTampil = tampilExpired(expBaruDB);
      if (idx >= 0) {
        const stokBaru = obatsBaru[idx].stok + Number(it.qty);
        await supabase.from('obat').update({ stok: stokBaru, expired: expBaruDB }).eq('id', obatsBaru[idx].id);
        obatsBaru[idx] = { ...obatsBaru[idx], stok: stokBaru, exp: expBaruTampil };
      } else {
        const { data } = await supabase.from('obat').insert([{ nama: it.nama, kategori: 'Lainnya', harga: Number(it.hargaBeli) * 1.5, stok: Number(it.qty), expired: expBaruDB, apotek_id: user?.id }]).select().single();
        if (data) obatsBaru.push({ ...data, exp: tampilExpired(data.expired) });
      }
    }
    setObats(obatsBaru);
    alert(`PO ${poForm.noFaktur} tersimpan! Stok otomatis bertambah, langsung bisa transaksi di Kasir.`);
    setPoForm({ noFaktur: '', supplier: 'PT. Kimia Farma Trading', jatuhTempo: '', items: [{ nama: '', qty: 1, hargaBeli: '', exp: '' }] });
    setHalaman('po');
  };

  const hariIni = new Date().toISOString().slice(0, 10);
  const trxHariIni = transaksis.filter(t => t.tanggalRaw === hariIni);
  const omsetHariIni = trxHariIni.reduce((a, t) => a + t.total, 0);
  const obatTerlaris = useMemo(() => {
    const map = {};
    transaksis.forEach(t => t.items.forEach(i => { map[i.nama] = (map[i.nama] || 0) + i.qty; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [transaksis]);

  const hutangPO = poList.filter(p => p.status === 'BELUM LUNAS');
  const totalHutang = hutangPO.reduce((s, p) => s + p.total, 0);

  const menu = [
    { id: 'kasir', label: '🛒 Kasir', desc: 'Penjualan' },
    { id: 'tambah', label: '➕ Tambah Obat', desc: 'Obat baru' },
    { id: 'stok', label: '📦 Kelola Stok', desc: `${obats.length} obat` },
    { id: 'pasien', label: '👤 Pasien', desc: `${listPasien.length} pasien` },
    { id: 'po', label: '📦 PO / Faktur', desc: hutangPO.length ? `${hutangPO.length} belum lunas` : 'Input faktur' },
    { id: 'suhu', label: '🌡️ Laporan Suhu', desc: `${logSuhu.length} catatan` },
    { id: 'riwayat', label: '🧾 Riwayat', desc: `${transaksis.length} transaksi` },
    { id: 'laporan', label: '📊 Laporan', desc: 'Omset hari ini' },
  ];

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', boxSizing: 'border-box', fontSize: 14 };
  const btnTeal = { background: '#0D9488', color: 'white', border: 'none', padding: '12px 18px', borderRadius: 999, fontWeight: 800, cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F9F7', fontFamily: 'system-ui, sans-serif', color: '#1e293b' }}>
      <div style={{ width: 240, background: 'white', borderRight: '1px solid #E2E8F0', padding: 16, position: 'fixed', top: 0, bottom: 0, left: sidebarOpen ? 0 : -260, zIndex: 50, transition: '0.2s', boxShadow: '0 0 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, background: 'white', borderRadius: 999, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#0D9488', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>R</div>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.5 }}>Ruang</div>
              <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.5, color: '#0D9488' }}>Apotek</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ border: 'none', background: '#F1F5F9', borderRadius: 999, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '6px 0 16px' }}>Kasir • Supabase • v2.1</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {menu.map(m => (
            <button key={m.id} onClick={() => { setHalaman(m.id); setSidebarOpen(false); }} style={{ textAlign: 'left', padding: '12px', borderRadius: 12, border: 'none', background: halaman === m.id ? '#0D9488' : '#F8FAFC', color: halaman === m.id ? 'white' : '#1e293b', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</span>
              <span style={{ fontSize: 11, opacity: 0.8 }}>{m.desc}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 'auto', background: '#FFFBEB', borderRadius: 12, padding: 12 }}>
          <b style={{ fontSize: 12 }}>⚠️ Obat hampir expired</b>
          <p style={{ fontSize: 12, margin: '6px 0 0' }}>{obats.filter(o => (o.exp || '').includes('2026')).length} obat exp 2026. Cek di Kelola Stok.</p>
          {hutangPO.length > 0 && <p style={{ fontSize: 12, margin: '8px 0 0', color: '#92400E', fontWeight: 700 }}>💸 Hutang PO: Rp {totalHutang.toLocaleString('id-ID')} ({hutangPO.length} faktur)</p>}
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: 0, width: '100%', padding: 14, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>☰ Menu</button>
          <span style={{ background: '#D1FAE5', color: '#065F46', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>● Online</span>
        </div>

        {halaman === 'kasir' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            {hutangPO.length > 0 && (
              <div onClick={() => setHalaman('po')} style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: 12, borderRadius: 14, fontSize: 13, color: '#92400E', cursor: 'pointer' }}>
                ⚠️ <b>{hutangPO.length} Faktur belum lunas</b> • Total hutang Rp {totalHutang.toLocaleString('id-ID')} • Klik untuk lihat →
              </div>
            )}
            <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
              <h2 style={{ margin: '0 0 12px' }}>Kasir</h2>
              <input value={cari} onChange={e => setCari(e.target.value)} placeholder="🔍 Cari obat... paracetamol" style={{ ...inp, borderRadius: 999, borderColor: '#99F6E4' }} />
              <p style={{ fontSize: 12, color: '#64748B' }}>{loadingObat ? 'Loading dari Supabase...' : `${obatTampil.length} obat ditemukan • Klik obat untuk masuk keranjang`}</p>
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
              {cart.length === 0 ? <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>Belum ada obat dipilih.<br/>Klik obat di atas.</p> : cart.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: 14 }}>
                  <span>{c.nama} <span style={{ color: '#94A3B8' }}>x{c.qty}</span></span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <b>Rp {(c.harga * c.qty).toLocaleString('id-ID')}</b>
                    <button onClick={() => setCart(cart.filter(x => x.id !== c.id))} style={{ border: 'none', background: '#FEF2F2', borderRadius: 999, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 18, fontWeight: 800 }}><span>Total</span><span>Rp {total.toLocaleString('id-ID')}</span></div>

              {/* ===== INPUT PASIEN - BARU, DI ATAS BAYAR ===== */}
              <div style={{ background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: 12, padding: 12, marginTop: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>👤 DATA PASIEN <span style={{ fontWeight: 400, color: '#64748B' }}>(Opsional, isi jika menggunakan resep)</span></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input placeholder="Ketik NIK 16 digit..." value={nik} onChange={e => cariPasien(e.target.value)} style={{ ...inp, flex: 1, minWidth: 180 }} />
                  <input placeholder="Nama Pasien" value={namaPasien} onChange={e => setNamaPasien(e.target.value)} style={{ ...inp, flex: 1, minWidth: 180 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <input placeholder="No HP (opsional)" value={noHp} onChange={e => setNoHp(e.target.value)} style={{ ...inp, flex: 1, minWidth: 180 }} />
                  <input placeholder="Alergi (opsional)" value={alergi} onChange={e => setAlergi(e.target.value)} style={{ ...inp, flex: 1, minWidth: 180 }} />
                </div>
                {pasienLama && <div style={{ fontSize: 12, color: '#0D9488', marginTop: 8 }}>✅ Pasien lama ketemu: {pasienLama.nama} {pasienLama.alergi ? `• Alergi: ${pasienLama.alergi}` : ''}</div>}
                {nik.length === 16 && !pasienLama && <div style={{ fontSize: 12, color: '#D97706', marginTop: 8 }}>🆕 Pasien baru, akan disimpan otomatis</div>}
                {nik.length > 0 && nik.length < 16 && <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>NIK kurang: {nik.length}/16 digit</div>}
              </div>

              <input value={bayar} onChange={e => setBayar(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Total bayar, contoh: 50000" style={{ ...inp, marginTop: 10, borderRadius: 999 }} />
              {bayar && <p style={{ fontSize: 13 }}>Kembalian: <b style={{ color: kembalian < 0 ? '#DC2626' : '#15803D' }}>Rp {kembalian.toLocaleString('id-ID')}</b></p>}
              <button onClick={checkout} style={{ ...btnTeal, width: '100%', marginTop: 8, padding: 14 }}>BAYAR & CETAK RESEP →</button>
              {strukTerakhir && (
                <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 12, marginTop: 12, fontSize: 13 }}>
                  <b>✅ Berhasil! {strukTerakhir.id}</b>{strukTerakhir.pasien_nama ? <><br/>Pasien: {strukTerakhir.pasien_nama} ({strukTerakhir.pasien_nik})</> : null}<br/>Total Rp {strukTerakhir.total.toLocaleString('id-ID')} • Kembalian Rp {strukTerakhir.kembalian.toLocaleString('id-ID')}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => {
                      const pesan = `KLINIK PRATAMA YAKRIJA\nNo: ${strukTerakhir.id}\n${strukTerakhir.pasien_nama ? `Pasien: ${strukTerakhir.pasien_nama}\nNIK: ${strukTerakhir.pasien_nik}\n` : ''}${strukTerakhir.items.map(i => `${i.nama} x${i.qty} = Rp ${(i.harga*i.qty).toLocaleString('id-ID')}`).join('\n')}\nTOTAL: Rp ${strukTerakhir.total.toLocaleString('id-ID')}\nBukti QRIS via EDC terpisah.\nTerima kasih :)`;
                      window.open(`https://wa.me/628818352063?text=${encodeURIComponent(pesan)}`, '_blank');
                    }} style={{ flex: 1, background: '#25D366', color: 'white', border: 'none', padding: 10, borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>💬 Kirim Struk WA</button>
                    <button onClick={() => window.print()} style={{ flex: 1, background: 'white', border: '1px solid #E2E8F0', padding: 10, borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>🖨️ Simpan PDF</button>
                  </div>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '8px 0 0', textAlign: 'center' }}>Bukti bayar QRIS sudah di-print via EDC.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {halaman === 'tambah' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 20, maxWidth: 520 }}>
            <h2 style={{ marginTop: 0 }}>{editId ? '✏️ Edit Obat' : '➕ Tambah Obat Baru'}</h2>
            <label style={{ fontSize: 12, fontWeight: 700 }}>NAMA OBAT</label><input value={formObat.nama} onChange={e => setFormObat({ ...formObat, nama: e.target.value })} placeholder="Contoh: Paracetamol 500mg" style={{ ...inp, margin: '6px 0 12px' }} />
            <label style={{ fontSize: 12, fontWeight: 700 }}>KATEGORI</label>
            <select value={formObat.kategori} onChange={e => setFormObat({ ...formObat, kategori: e.target.value })} style={{ ...inp, margin: '6px 0 12px' }}>
              {['Demam', 'Antibiotik', 'Lambung', 'Luka', 'Vitamin', 'Batuk', 'Radang', 'Lainnya'].map(k => <option key={k}>{k}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 700 }}>HARGA</label><input value={formObat.harga} onChange={e => setFormObat({ ...formObat, harga: e.target.value.replace(/[^0-9]/g, '') })} placeholder="5000" style={{ ...inp, margin: '6px 0 12px' }} /></div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 700 }}>STOK</label><input value={formObat.stok} onChange={e => setFormObat({ ...formObat, stok: e.target.value.replace(/[^0-9]/g, '') })} placeholder="50" style={{ ...inp, margin: '6px 0 12px' }} /></div>
            </div>
            <label style={{ fontSize: 12, fontWeight: 700 }}>TANGGAL EXPIRED</label>
            <input type="month" value={formObat.exp ? (formObat.exp.includes('/') ? (() => { const [b, t] = formObat.exp.split('/'); return `${t}-${b}`; })() : formObat.exp.slice(0, 7)) : ''} onChange={e => setFormObat({ ...formObat, exp: e.target.value })} style={{ ...inp, margin: '6px 0 16px' }} />
            <p style={{ fontSize: 11, color: '#64748B', marginTop: -10 }}>Pilih bulan + tahun, otomatis disimpan jadi 2027-12-01 di Supabase</p>
            <button onClick={simpanObatBaru} style={{ ...btnTeal, width: '100%' }}>{editId ? 'Simpan Perubahan' : 'Simpan Obat Baru →'}</button>
            {editId && <button onClick={() => { setEditId(null); setFormObat({ nama: '', kategori: 'Demam', harga: '', stok: '', exp: '' }); }} style={{ width: '100%', background: 'white', border: '1px solid #E2E8F0', padding: 12, borderRadius: 999, marginTop: 8, cursor: 'pointer' }}>Batal Edit</button>}
          </div>
        )}

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
                  <button onClick={() => hapusObat(o)} style={{ background: '#FEF2F2', border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {halaman === 'pasien' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>👤 Daftar Pasien</h2>
            <input value={cariPasienInput} onChange={e => setCariPasienInput(e.target.value)} placeholder="🔍 Cari NIK / Nama pasien..." style={{ ...inp, borderRadius: 999, marginBottom: 12 }} />
            <p style={{ fontSize: 12, color: '#64748B' }}>{listPasien.length} pasien tersimpan • NIK jadi ID utama</p>
            {listPasien.filter(p => (p.nama || '').toLowerCase().includes(cariPasienInput.toLowerCase()) || (p.nik || '').includes(cariPasienInput)).map(p => {
              const riwayat = transaksis.filter(t => t.pasien_nik === p.nik);
              return (
                <div key={p.nik} style={{ border: '1px solid #F1F5F9', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div><b>{p.nama}</b><div style={{ fontSize: 12, color: '#64748B' }}>NIK: {p.nik} {p.no_hp ? `• HP: ${p.no_hp}` : ''} {p.alergi ? `• Alergi: ${p.alergi}` : ''}</div></div>
                    <button onClick={() => { setNik(p.nik); setNamaPasien(p.nama); setNoHp(p.no_hp || ''); setAlergi(p.alergi || ''); setPasienLama(p); setHalaman('kasir'); }} style={{ background: '#0D9488', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>🛒 Pakai di Kasir →</button>
                  </div>
                  <div style={{ fontSize: 12, marginTop: 8, color: '#64748B' }}>{riwayat.length === 0 ? 'Belum ada riwayat belanja' : `${riwayat.length}x belanja: ` + riwayat.slice(0, 3).map(r => `${r.id} (Rp ${r.total.toLocaleString('id-ID')})`).join(', ')}</div>
                </div>
              );
            })}
            {listPasien.length === 0 && <p style={{ color: '#94A3B8', fontSize: 13 }}>Belum ada pasien. Isi NIK di Kasir, otomatis tersimpan di sini.</p>}
          </div>
        )}

        {halaman === 'po' && (
          <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ background: 'white', borderRadius: 16, padding: 16, flex: 1, minWidth: 160 }}><div style={{ fontSize: 12, color: '#64748B' }}>Total Hutang (Belum Lunas)</div><b style={{ fontSize: 20, color: '#DC2626' }}>Rp {totalHutang.toLocaleString('id-ID')}</b></div>
              <div style={{ background: 'white', borderRadius: 16, padding: 16, flex: 1, minWidth: 160 }}><div style={{ fontSize: 12, color: '#64748B' }}>Total Faktur</div><b style={{ fontSize: 20 }}>{poList.length} Faktur</b></div>
            </div>
            <div style={{ background: 'white', borderRadius: 18, padding: 16, marginTop: 12 }}>
              <h2 style={{ marginTop: 0 }}>📦 Input Faktur Baru</h2>
              <label style={{ fontSize: 12, fontWeight: 700 }}>NO. FAKTUR (dari kertas PBF)</label>
              <input value={poForm.noFaktur} onChange={e => setPoForm({ ...poForm, noFaktur: e.target.value })} placeholder="Contoh: FK-INV-8821" style={{ ...inp, margin: '6px 0 12px' }} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>SUPPLIER / PBF</label>
                  <select value={poForm.supplier} onChange={e => setPoForm({ ...poForm, supplier: e.target.value })} style={{ ...inp, margin: '6px 0 12px' }}>
                    <option>PT. Kimia Farma Trading</option><option>PT. Anugerah Pharmindo Lestari</option><option>PT. Enseval Putera Megatrading</option><option>PT. Millenium Pharmacon International</option><option>PT. Parit Padang Global</option>
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>JATUH TEMPO</label>
                  <input type="date" value={poForm.jatuhTempo} onChange={e => setPoForm({ ...poForm, jatuhTempo: e.target.value })} style={{ ...inp, margin: '6px 0 12px' }} />
                </div>
              </div>
              <b style={{ fontSize: 13 }}>Daftar Obat di Faktur</b>
              {poForm.items.map((it, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', padding: 12, borderRadius: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input list="daftar-obat" placeholder="Nama Obat - ketik, stok otomatis bertambah" value={it.nama} onChange={e => { const c = [...poForm.items]; c[idx].nama = e.target.value; setPoForm({ ...poForm, items: c }); }} style={inp} />
                  <datalist id="daftar-obat">{obats.map(o => <option key={o.id} value={o.nama} />)}</datalist>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" placeholder="Qty" value={it.qty} onChange={e => { const c = [...poForm.items]; c[idx].qty = e.target.value; setPoForm({ ...poForm, items: c }); }} style={{ ...inp, flex: 1 }} />
                    <input type="number" placeholder="Harga Beli / pcs" value={it.hargaBeli} onChange={e => { const c = [...poForm.items]; c[idx].hargaBeli = e.target.value; setPoForm({ ...poForm, items: c }); }} style={{ ...inp, flex: 1.5 }} />
                    <input type="date" value={it.exp} onChange={e => { const c = [...poForm.items]; c[idx].exp = e.target.value; setPoForm({ ...poForm, items: c }); }} style={{ ...inp, flex: 1 }} />
                  </div>
                </div>
              ))}
              <button onClick={() => setPoForm({ ...poForm, items: [...poForm.items, { nama: '', qty: 1, hargaBeli: '', exp: '' }] })} style={{ width: '100%', padding: 10, border: '1px dashed #0D9488', background: 'white', color: '#0D9488', borderRadius: 999, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>+ Tambah Obat Lagi</button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, background: '#0F172A', color: 'white', padding: 14, borderRadius: 12 }}>
                <div><div style={{ fontSize: 11, opacity: 0.7 }}>TOTAL FAKTUR</div><b style={{ fontSize: 18 }}>Rp {poForm.items.reduce((s, it) => s + (Number(it.qty) * Number(it.hargaBeli || 0)), 0).toLocaleString('id-ID')}</b></div>
                <button onClick={simpanPO} style={btnTeal}>Simpan & Tambah Stok →</button>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 18, padding: 16, marginTop: 12 }}>
              <b>📋 Daftar Faktur</b>
              {poList.length === 0 ? <p style={{ color: '#94A3B8', fontSize: 13 }}>Belum ada faktur. Input faktur pertama di atas.</p> : poList.map(p => (
                <div key={p.id} style={{ border: '1px solid #F1F5F9', borderRadius: 12, padding: 12, marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div><b>{p.noFaktur}</b> • {p.supplier}<div style={{ fontSize: 12, color: '#64748B' }}>Tgl: {p.tanggal} • Jatuh Tempo: {p.jatuhTempo || '-'} • {p.items.length} obat</div></div>
                    <div style={{ textAlign: 'right' }}><b>Rp {p.total.toLocaleString('id-ID')}</b><div>{p.status === 'LUNAS' ? <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>✅ LUNAS</span> : <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>⏳ BELUM LUNAS</span>}</div></div>
                  </div>
                  <div style={{ fontSize: 12, marginTop: 8, background: '#F8FAFC', padding: 8, borderRadius: 8 }}>{p.items.map((it, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{it.nama} x{it.qty}</span><span>Rp {(Number(it.qty) * Number(it.hargaBeli || 0)).toLocaleString('id-ID')}</span></div>)}</div>
                  {p.status !== 'LUNAS' && <button onClick={() => setPoList(poList.map(x => x.id === p.id ? { ...x, status: 'LUNAS' } : x))} style={{ marginTop: 8, background: '#0D9488', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>✓ Tandai Lunas</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {halaman === 'suhu' && (
          <div>
            <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div><h2 style={{ margin: 0 }}>🌡️ Laporan Suhu Harian</h2><p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 12 }}>Data dari Supabase • Untuk audit Dinas Kesehatan</p></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => window.open('/cetak-barcode-suhu', '_blank')} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>🖨️ Cetak Barcode</button>
                  <button onClick={() => {
                    const header = 'Tanggal,Jam,Ruangan,Suhu,Kelembaban,Petugas,Shift,Status\n';
                    const rows = logSuhu.map(d => `${d.tanggal},${d.jam},${d.ruangan},${d.suhu},${d.lembab || ''},${d.nama},${d.shift},${d.status}`).join('\n');
                    const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'Laporan-Suhu-Yakrija.csv'; a.click();
                  }} style={btnTeal}>⬇️ Download Excel</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <div style={{ background: '#F0FDF4', padding: '10px 14px', borderRadius: 12, flex: 1 }}><b style={{ color: '#059669' }}>{logSuhu.filter(d => d.status === 'SESUAI').length} Sesuai</b><div style={{ fontSize: 11, color: '#64748B' }}>Suhu 15-25°C</div></div>
                <div style={{ background: '#FEF2F2', padding: '10px 14px', borderRadius: 12, flex: 1 }}><b style={{ color: '#DC2626' }}>{logSuhu.filter(d => d.status === 'TIDAK SESUAI').length} Tidak Sesuai</b><div style={{ fontSize: 11, color: '#64748B' }}>Perlu tindakan</div></div>
                <select value={filterSuhu} onChange={e => setFilterSuhu(e.target.value)} style={{ padding: '10px', borderRadius: 12, border: '1px solid #E2E8F0' }}><option>Semua</option><option>Ruang Racik</option><option>Gudang Obat</option></select>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 18, padding: 16, marginTop: 12 }}>
              {logSuhu.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ fontSize: 40 }}>🌡️</div>
                  <b>Belum ada data suhu</b>
                  <p style={{ color: '#64748B', fontSize: 13 }}>Cetak barcode & tempel di dinding, staff scan tiap ganti shift.</p>
                  <button onClick={() => window.open('/cetak-barcode-suhu', '_blank')} style={btnTeal}>🖨️ Cetak Barcode Sekarang →</button>
                </div>
              ) : logSuhu.filter(d => filterSuhu === 'Semua' || d.ruangan === filterSuhu).map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: 8 }}>
                  <div><b>{d.ruangan}</b><div style={{ fontSize: 12, color: '#64748B' }}>{d.tanggal} • {d.jam} • {d.nama} • {d.shift}</div></div>
                  <div style={{ textAlign: 'right' }}><b style={{ color: d.status === 'TIDAK SESUAI' ? '#DC2626' : '#0F766E' }}>{d.suhu}°C</b> <span style={{ fontSize: 12, color: '#64748B' }}>{d.lembab ? `• ${d.lembab}%` : ''}</span><div>{d.status === 'SESUAI' ? <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>✅ SESUAI</span> : <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>⚠️ TIDAK SESUAI</span>}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {halaman === 'riwayat' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>🧾 Rincian Riwayat Transaksi</h2>
            {transaksis.length === 0 ? <p style={{ color: '#94A3B8' }}>Belum ada transaksi. Mulai transaksi di Kasir.</p> : transaksis.map(t => (
              <button key={t.id} onClick={() => setDetailTransaksi(t)} style={{ width: '100%', textAlign: 'left', background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                <span><b>{t.id}</b><div style={{ fontSize: 12, color: '#64748B' }}>{t.tanggal} • {t.items.reduce((a, i) => a + i.qty, 0)} item {t.pasien_nama ? `• Pasien: ${t.pasien_nama}` : ''}</div></span>
                <b>Rp {t.total.toLocaleString('id-ID')} →</b>
              </button>
            ))}
            {detailTransaksi && (
              <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>Struk {detailTransaksi.id}</b><button onClick={() => setDetailTransaksi(null)} style={{ border: 'none', background: 'white', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>✕ Tutup</button></div>
                <p style={{ fontSize: 12, color: '#64748B' }}>{detailTransaksi.tanggal}{detailTransaksi.pasien_nama ? ` • Pasien: ${detailTransaksi.pasien_nama} (${detailTransaksi.pasien_nik})` : ''}</p>
                {detailTransaksi.items.map((i, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}><span>{i.nama} x{i.qty}</span><span>Rp {(i.harga * i.qty).toLocaleString('id-ID')}</span></div>)}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}><span>Total</span><b>Rp {detailTransaksi.total.toLocaleString('id-ID')}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}><span>Bayar</span><span>Rp {detailTransaksi.bayar.toLocaleString('id-ID')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}><span>Kembalian</span><span>Rp {detailTransaksi.kembalian.toLocaleString('id-ID')}</span></div>
                <button onClick={() => {
                  const pesan = `KLINIK PRATAMA YAKRIJA\nNo: ${detailTransaksi.id}\n${detailTransaksi.pasien_nama ? `Pasien: ${detailTransaksi.pasien_nama}\n` : ''}${detailTransaksi.items.map(i => `${i.nama} x${i.qty} = Rp ${(i.harga*i.qty).toLocaleString('id-ID')}`).join('\n')}\nTOTAL: Rp ${detailTransaksi.total.toLocaleString('id-ID')}`;
                  window.open(`https://wa.me/628818352063?text=${encodeURIComponent(pesan)}`, '_blank');
                }} style={{ background: '#25D366', color: 'white', border: 'none', padding: 12, borderRadius: 999, width: '100%', marginTop: 12, fontWeight: 800, cursor: 'pointer' }}>💬 Kirim Ulang Via WA</button>
              </div>
            )}
          </div>
        )}

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
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: 14 }}><span>{t.id} • {t.tanggal}{t.pasien_nama ? ` • ${t.pasien_nama}` : ''}</span><b>Rp {t.total.toLocaleString('id-ID')}</b></div>
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 20 }}>RuangApotek v2.1 • Data tersimpan di Supabase • Online</p>
      </div>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }}></div>}
    </div>
  );
}