import { useState, useMemo, useEffect } from 'react';
import { supabase } from './supabase';

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
  const [halaman, setHalaman] = useState('laporan');
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [obats, setObats] = useState([]);
  const [loadingObat, setLoadingObat] = useState(true);
  const [transaksis, setTransaksis] = useState([]);
  const [cart, setCart] = useState([]);
  const [cari, setCari] = useState('');
  const [cariStok, setCariStok] = useState('');
  const [bayar, setBayar] = useState('');
  const [strukTerakhir, setStrukTerakhir] = useState(null);
  const [detailTransaksi, setDetailTransaksi] = useState(null);

  const [formObat, setFormObat] = useState({ nama: '', kategori: 'Demam', harga: '', stok: '', exp: '' });
  const [editId, setEditId] = useState(null);

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

  const loadObats = async () => {
    setLoadingObat(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setObats([]); setLoadingObat(false); return; }
    const { data, error } = await supabase.from('obat').select('*').eq('apotek_id', user.id).order('nama');
    if (error) { console.error(error); setObats([]); }
    else if (!data || data.length === 0) {
      // FIX 4: Kalau mau tiap apotek mulai dari NOL, hapus blok seed ini.
      // Kalau mau tetap ada 4 obat awal, biarkan. Tapi ingat, ini copy baru per apotek, bukan data apotek lain.
      const toInsert = OBAT_AWAL.map(o => ({ nama: o.nama, kategori: o.kategori, harga: o.harga, stok: o.stok, expired: konversiExpired(o.exp), apotek_id: user.id }));
      await supabase.from('obat').insert(toInsert);
      const { data: data2 } = await supabase.from('obat').select('*').eq('apotek_id', user.id).order('nama');
      setObats((data2 || []).map(d => ({ ...d, exp: tampilExpired(d.expired) })));
    } else {
      setObats(data.map(d => ({ ...d, exp: tampilExpired(d.expired) })));
    }
    setLoadingObat(false);
  };

  const loadSuhu = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('log_suhu').select('*').eq('apotek_id', user.id).order('created_at', { ascending: false });
    if (data) setLogSuhu(data);
  };

  // FIX 3a: loadPasien difilter
  const loadPasien = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('pasien').select('*').eq('apotek_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (data) setListPasien(data);
  };

  // FIX 2a: loadTransaksis dari Supabase, difilter apotek
  const loadTransaksis = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('transaksi').select('*').eq('apotek_id', user.id).order('created_at', { ascending: false }).limit(200);
    if (error) { console.log('Gagal load transaksi:', error.message); return; }
   const hasil = (data || []).map((t) => ({
    id: 'TRX-' + String(t.id).padStart(6, '0'),
    tanggal: new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    tanggalRaw: new Date(t.created_at).toISOString().slice(0, 10),
    items: t.items || [],
    total: Number(t.total_harga) || 0,
    bayar: Number(t.bayar) || Number(t.total_harga) || 0, // <-- kalau transaksi lama bayar-nya 0, pakai total aja biar gak kosong
    kembalian: Number(t.kembalian) || 0, // <-- BARU
    pasien_nik: t.pasien_nik,
    pasien_nama: t.pasien_nama,
  }));
    setTransaksis(hasil);
  };

  useEffect(() => { loadObats(); loadSuhu(); loadPasien(); loadTransaksis(); }, []);
  // HAPUS useEffect localStorage transaksi yang lama
  useEffect(() => { localStorage.setItem('ruangapotek_po', JSON.stringify(poList)); }, [poList]);

  // FIX 3b: cariPasien difilter
  const cariPasien = async (nikInput) => {
    const bersih = nikInput.replace(/\D/g, '').slice(0, 16);
    setNik(bersih);
    if (bersih.length === 16) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('pasien').select('*').eq('nik', bersih).eq('apotek_id', user.id).single();
      if (data) {
        setNamaPasien(data.nama || ''); setNoHp(data.no_hp || ''); setAlergi(data.alergi || ''); setPasienLama(data);
      } else { setPasienLama(null); setNamaPasien(''); setNoHp(''); setAlergi(''); }
    } else { setPasienLama(null); }
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

  // FIX 1: checkout dibenerin total, 1x insert aja, + update state + clear cart
  const checkout = async () => {
    if (!cart.length) return alert('Keranjang masih kosong!');
    if (!bayar || Number(bayar) < total) return alert(`Uang kurang! Total Rp ${total.toLocaleString('id-ID')}`);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Harus login dulu!');

    if (nik) {
      if (nik.length !== 16) return alert('NIK harus 16 digit!');
      if (!namaPasien) return alert('Isi nama pasien dulu!');
      // FIX: Jangan pakai upsert, karena upsert nyangkut ke NIK apotek lain & kena RLS.
// Cek dulu, pasien ini udah ada di APOTEK INI apa belum?
const { data: pasienAda } = await supabase
  .from('pasien')
  .select('nik')
  .eq('nik', nik)
  .eq('apotek_id', user.id)
  .maybeSingle();

let errPasien = null;
if (pasienAda) {
  // Kalau udah ada di apotek ini, update aja
  const { error } = await supabase
    .from('pasien')
    .update({ nama: namaPasien, no_hp: noHp || null, alergi: alergi || null })
    .eq('nik', nik)
    .eq('apotek_id', user.id);
  errPasien = error;
} else {
  // Kalau belum ada, insert baru
  const { error } = await supabase
    .from('pasien')
    .insert([{ nik: nik, nama: namaPasien, no_hp: noHp || null, alergi: alergi || null, apotek_id: user.id }]);
  errPasien = error;
}
if (errPasien) return alert('Gagal simpan pasien: ' + errPasien.message);
      loadPasien();
    }

    const trx = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      tanggal: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      tanggalRaw: new Date().toISOString().slice(0, 10),
      items: cart, total, bayar: Number(bayar), kembalian,
      pasien_nik: nik || null, pasien_nama: namaPasien || null,
    };

    // CUMA 1x INSERT, dengan apotek_id
    const { error: errTrx } = await supabase.from('transaksi').insert([{
      pasien_nik: nik || null, pasien_nama: namaPasien || null, total_harga: total, bayar: Number(bayar), // <-- BARU
      kembalian: kembalian, // <-- BARU
      items: cart.map(c => ({ id: c.id, nama: c.nama, harga: c.harga, qty: c.qty })),
      metode_bayar: 'tunai', apotek_id: user.id,
    }]);
    if (errTrx) return alert('Gagal simpan transaksi: ' + errTrx.message);

    for (const c of cart) {
      const obatBaru = obats.find(o => o.id === c.id);
      if (obatBaru) await supabase.from('obat').update({ stok: obatBaru.stok - c.qty }).eq('id', c.id);
    }
    setObats(obats.map(o => {
      const diCart = cart.find(c => c.id === o.id);
      return diCart ? { ...o, stok: o.stok - diCart.qty } : o;
    }));

    // INI YANG HILANG:
    setTransaksis([trx, ...transaksis]);
    setStrukTerakhir(trx);
    setCart([]); setBayar('');
    setNik(''); setNamaPasien(''); setNoHp(''); setAlergi(''); setPasienLama(null);
    loadTransaksis();
    loadObats();
  };

  const simpanObatBaru = async () => {
    if (!formObat.nama || !formObat.harga || !formObat.stok) return alert('Isi Nama, Harga, Stok dulu!');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Harus login dulu!');
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
    alert(`PO ${poForm.noFaktur} tersimpan! Stok otomatis bertambah.`);
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
  // ===== GRAFIK PENJUALAN PER HARI =====
const grafikHarian = useMemo(() => {
  const map = {};
  transaksis.forEach(t => {
    const tgl = t.tanggalRaw || new Date().toISOString().slice(0, 10);
    if (!map[tgl]) map[tgl] = { tanggal: tgl, total: 0, jumlah: 0 };
    map[tgl].total += Number(t.total) || 0;
    map[tgl].jumlah += 1;
  });
  // Ambil 7 hari terakhir aja, urut dari yang paling lama ke baru
  return Object.values(map).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(-7);
}, [transaksis]);

const maxGrafik = Math.max(...grafikHarian.map(g => g.total), 1);
const formatTglGrafik = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};
  const totalHutang = hutangPO.reduce((s, p) => s + p.total, 0);

  const menu = [
    { id: 'laporan', label: '📊 Laporan', desc: 'Omset hari ini' },
    { id: 'kasir', label: '🛒 Kasir', desc: 'Penjualan' },
    { id: 'stok', label: '📦 Kelola Stok', desc: `${obats.length} obat` },
    { id: 'pasien', label: '👤 Pasien', desc: `${listPasien.length} pasien` },
    { id: 'po', label: '📦 PO / Faktur', desc: hutangPO.length ? `${hutangPO.length} belum lunas` : 'Input faktur' },
    { id: 'suhu', label: '🌡️ Laporan Suhu', desc: `${logSuhu.length} catatan` },
    { id: 'riwayat', label: '🧾 Riwayat', desc: `${transaksis.length} transaksi` },
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
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '6px 0 16px' }}>Kasir • v2.1</p>
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
  <button onClick={() => setSidebarOpen(true)} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>☰</button>
  <button onClick={() => setDark(!dark)} style={{ fontSize: 18, background: dark ? '#1e293b' : '#e2e8f0', border: 'none', cursor: 'pointer', borderRadius: 20, padding: '6px 10px' }}>
    {dark ? '☀️' : '🌙'}
  </button>
</div>
          <span style={{ background: '#D1FAE5', color: '#065F46', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>● Online</span>
        </div>

         {halaman === 'laporan' && (
  <div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 12, color: '#64748B' }}>Omset Hari Ini</div><b style={{ fontSize: 22 }}>Rp {omsetHariIni.toLocaleString('id-ID')}</b></div>
      <div style={{ background: 'white', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 12, color: '#64748B' }}>Transaksi Hari Ini</div><b style={{ fontSize: 22 }}>{trxHariIni.length}x</b></div>
      <div style={{ background: 'white', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 12, color: '#64748B' }}>Total Semua Transaksi</div><b style={{ fontSize: 22 }}>{transaksis.length}x</b></div>
    </div>

    {/* ===== GRAFIK PENJUALAN PER HARI - ===== */}
    <div style={{ background: 'white', borderRadius: 16, padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b>📊 Grafik Penjualan Per Hari</b>
        <span style={{ fontSize: 11, color: '#64748B', background: '#F1F5F9', padding: '4px 8px', borderRadius: 999 }}>7 Hari Terakhir</span>
      </div>

      {grafikHarian.length === 0 ? (
        <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: 20 }}>Belum ada penjualan.<br/>Transaksi di Kasir dulu, grafiknya langsung muncul di sini.</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 180, marginTop: 16, padding: '0 4px', borderBottom: '1px solid #E2E8F0' }}>
            {grafikHarian.map(g => (
              <div key={g.tanggal} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0D9488', marginBottom: 6, textAlign: 'center' }}>
                  {g.total >= 1000000 ? `Rp ${(g.total / 1000000).toFixed(1)}jt` : `Rp ${(g.total / 1000).toFixed(0)}rb`}
                </div>
                <div style={{
                  width: '100%', maxWidth: 56,
                  height: `${Math.max((g.total / maxGrafik) * 100, 6)}%`,
                  background: g.tanggal === hariIni ? '#0D9488' : '#99F6E4',
                  borderRadius: '10px 10px 0 0',
                  transition: '0.3s',
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, padding: '0 4px' }}>
            {grafikHarian.map(g => (
              <div key={g.tanggal} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{formatTglGrafik(g.tanggal)}</div>
                <div style={{ fontSize: 10, color: '#64748B' }}>{g.jumlah}x trx</div>
              </div>
            ))}
          </div>

          {/* Tabel detail di bawah grafik, biar angkanya akurat */}
          <div style={{ marginTop: 16, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
            {[...grafikHarian].reverse().map(g => (
              <div key={g.tanggal} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F8FAFC', fontSize: 13 }}>
                <span>{formatTglGrafik(g.tanggal)} {g.tanggal === hariIni ? <span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 6px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>HARI INI</span> : ''} • {g.jumlah}x transaksi</span>
                <b>Rp {g.total.toLocaleString('id-ID')}</b>
              </div>
            ))}
          </div>
        </>
      )}
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
        {halaman === 'kasir' && (
  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
    
    {/* ===== KIRI : LIST OBAT ===== */}
  <div style={{ flex: '1 1 340px', minWidth: 0, width: '100%' }}>
      {hutangPO.length > 0 && (
        <div onClick={() => setHalaman('po')} style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: 12, borderRadius: 14, fontSize: 13, color: '#92400E', cursor: 'pointer', marginBottom: 14 }}>
          ⚠️ <b>{hutangPO.length} Faktur belum lunas</b> • Total hutang Rp {totalHutang.toLocaleString('id-ID')} • Klik untuk lihat →
        </div>
      )}
      <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>Kasir</h2>
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
    </div>

    {/* ===== KANAN : KERANJANG + KASIR - NEMPEL ===== */}
    <div style={{ width: 360, flexShrink: 0, position: 'sticky', top: 14, maxHeight: 'calc(100vh - 28px)', overflowY: 'auto' }}>
      <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
        <b>🧾 Keranjang ({cart.reduce((a, c) => a + c.qty, 0)})</b>

        {/* Yang di-scroll cuma isi keranjangnya aja */}
        <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
          {cart.length === 0 ? <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>Belum ada obat dipilih.<br/>Klik obat di kiri.</p> : cart.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: 14 }}>
              <span>{c.nama} <span style={{ color: '#94A3B8' }}>x{c.qty}</span></span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <b>Rp {(c.harga * c.qty).toLocaleString('id-ID')}</b>
                <button onClick={() => setCart(cart.filter(x => x.id !== c.id))} style={{ border: 'none', background: '#FEF2F2', borderRadius: 999, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 18, fontWeight: 800 }}><span>Total</span><span>Rp {total.toLocaleString('id-ID')}</span></div>
        <div style={{ background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: 12, padding: 12, marginTop: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>👤 DATA PASIEN <span style={{ fontWeight: 400, color: '#64748B' }}>(Opsional)</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Ketik NIK 16 digit..." value={nik} onChange={e => cariPasien(e.target.value)} style={{ ...inp, flex: 1, minWidth: 140 }} />
            <input placeholder="Nama Pasien" value={namaPasien} onChange={e => setNamaPasien(e.target.value)} style={{ ...inp, flex: 1, minWidth: 140 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <input placeholder="No HP (opsional)" value={noHp} onChange={e => setNoHp(e.target.value)} style={{ ...inp, flex: 1, minWidth: 140 }} />
            <input placeholder="Alergi (opsional)" value={alergi} onChange={e => setAlergi(e.target.value)} style={{ ...inp, flex: 1, minWidth: 140 }} />
          </div>
          {pasienLama && <div style={{ fontSize: 12, color: '#0D9488', marginTop: 8 }}>✅ Pasien lama ketemu: {pasienLama.nama}</div>}
          {nik.length === 16 && !pasienLama && <div style={{ fontSize: 12, color: '#D97706', marginTop: 8 }}>🆕 Pasien baru, akan disimpan otomatis</div>}
        </div>
        <input value={bayar} onChange={e => setBayar(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Total bayar, contoh: 50000" style={{ ...inp, marginTop: 10, borderRadius: 999 }} />
        {bayar && <p style={{ fontSize: 13 }}>Kembalian: <b style={{ color: kembalian < 0 ? '#DC2626' : '#15803D' }}>Rp {kembalian.toLocaleString('id-ID')}</b></p>}
        <button onClick={checkout} style={{ ...btnTeal, width: '100%', marginTop: 8, padding: 14 }}>BAYAR & CETAK RESEP →</button>
        {strukTerakhir && (
          <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 12, marginTop: 12, fontSize: 13 }}>
            <b>✅ Berhasil! {strukTerakhir.id}</b><br/>Total Rp {strukTerakhir.total.toLocaleString('id-ID')} • Kembalian Rp {strukTerakhir.kembalian.toLocaleString('id-ID')}
          </div>
        )}
      </div>
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
    <button onClick={simpanObatBaru} style={{ ...btnTeal, width: '100%' }}>{editId ? 'Simpan Perubahan' : 'Simpan Obat Baru →'}</button>
  </div>
)}      
         {halaman === 'stok' && (
            <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>📦 Kelola Stok Obat</h2>
                <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260, justifyContent: 'flex-end' }}>
                  {/* ===== TOMBOL CARI - BARU ===== */}
                  <input
                    value={cariStok}
                    onChange={e => setCariStok(e.target.value)}
                    placeholder="🔍 Cari obat..."
                    style={{ ...inp, borderRadius: 999, maxWidth: 240, padding: '10px 14px' }}
                  />
                  <button onClick={() => setHalaman('tambah')} style={{ ...btnTeal, whiteSpace: 'nowrap' }}>+ Obat Baru</button>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#64748B' }}>
                {cariStok
                  ? `Hasil cari "${cariStok}": ${obats.filter(o => o.nama.toLowerCase().includes(cariStok.toLowerCase())).length} obat`
                  : `Total ${obats.length} obat • Stok menipis (<20) warna kuning, Expired 2026 warna merah`}
              </p>
              {cariStok && (
                <button onClick={() => setCariStok('')} style={{ background: '#F1F5F9', border: 'none', padding: '6px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', marginBottom: 8 }}>
                  ✕ Hapus filter "{cariStok}"
                </button>
              )}
              {obats
                .filter(o => o.nama.toLowerCase().includes(cariStok.toLowerCase()))
                .map(o => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}><b style={{ fontSize: 14 }}>{o.nama}</b><div style={{ fontSize: 12, color: '#64748B' }}>{o.kategori} • Exp: {o.exp} • Rp {o.harga.toLocaleString('id-ID')}</div></div>
                    <span style={{ fontWeight: 800, fontSize: 14, background: o.stok < 20 ? '#FEF3C7' : '#F0FDF4', padding: '6px 10px', borderRadius: 999 }}>Stok: {o.stok}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditId(o.id); setFormObat({ nama: o.nama, kategori: o.kategori, harga: String(o.harga), stok: String(o.stok), exp: o.exp }); setHalaman('tambah'); }} style={{ background: '#EFF6FF', border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>✏️ Edit</button>
                      <button onClick={() => hapusObat(o)} style={{ background: '#FEF2F2', border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              {obats.filter(o => o.nama.toLowerCase().includes(cariStok.toLowerCase())).length === 0 && (
                <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: 20 }}>
                  {cariStok ? `Gak ada obat "${cariStok}"` : 'Belum ada obat.'}
                </p>
              )}
            </div>
          )}

        {halaman === 'pasien' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>👤 Daftar Pasien</h2>
            <input value={cariPasienInput} onChange={e => setCariPasienInput(e.target.value)} placeholder="🔍 Cari NIK / Nama pasien..." style={{ ...inp, borderRadius: 999, marginBottom: 12 }} />
            {listPasien.filter(p => (p.nama || '').toLowerCase().includes(cariPasienInput.toLowerCase()) || (p.nik || '').includes(cariPasienInput)).map(p => (
              <div key={p.nik} style={{ border: '1px solid #F1F5F9', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <b>{p.nama}</b><div style={{ fontSize: 12, color: '#64748B' }}>NIK: {p.nik} {p.no_hp ? `• HP: ${p.no_hp}` : ''} {p.alergi ? `• Alergi: ${p.alergi}` : ''}</div>
              </div>
            ))}
            {listPasien.length === 0 && <p style={{ color: '#94A3B8', fontSize: 13 }}>Belum ada pasien.</p>}
          </div>
        )}

        {halaman === 'po' && (
          <div>
            <div style={{ background: 'white', borderRadius: 18, padding: 16, marginTop: 12 }}>
              <h2 style={{ marginTop: 0, fontSize: 24, fontWeight: 900}}>📦 Input Faktur Baru</h2>
              <label style={{ fontSize: 12, fontWeight: 700 }}>NO. FAKTUR</label>
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
              {poForm.items.map((it, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', padding: 12, borderRadius: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input list="daftar-obat" placeholder="Nama Obat" value={it.nama} onChange={e => { const c = [...poForm.items]; c[idx].nama = e.target.value; setPoForm({ ...poForm, items: c }); }} style={inp} />
                  <datalist id="daftar-obat">{obats.map(o => <option key={o.id} value={o.nama} />)}</datalist>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" placeholder="Qty" value={it.qty} onChange={e => { const c = [...poForm.items]; c[idx].qty = e.target.value; setPoForm({ ...poForm, items: c }); }} style={{ ...inp, flex: 1 }} />
                    <input type="number" placeholder="Harga Beli / pcs" value={it.hargaBeli} onChange={e => { const c = [...poForm.items]; c[idx].hargaBeli = e.target.value; setPoForm({ ...poForm, items: c }); }} style={{ ...inp, flex: 1.5 }} />
                    <input type="date" value={it.exp} onChange={e => { const c = [...poForm.items]; c[idx].exp = e.target.value; setPoForm({ ...poForm, items: c }); }} style={{ ...inp, flex: 1 }} />
                  </div>
                </div>
              ))}
              <button onClick={() => setPoForm({ ...poForm, items: [...poForm.items, { nama: '', qty: 1, hargaBeli: '', exp: '' }] })} style={{ width: '100%', padding: 10, border: '1px dashed #0D9488', background: 'white', color: '#0D9488', borderRadius: 999, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>+ Tambah Obat Lagi</button>
              <button onClick={simpanPO} style={{ ...btnTeal, width: '100%', marginTop: 12 }}>Simpan & Tambah Stok →</button>
            </div>
          </div>
        )}

        {halaman === 'suhu' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900}}>🌡️ Laporan Suhu Harian</h2>
            {logSuhu.length === 0 ? <p>Belum ada data suhu</p> : logSuhu.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div><b>{d.ruangan}</b><div style={{ fontSize: 12, color: '#64748B' }}>{d.tanggal} • {d.jam} • {d.nama}</div></div>
                <b>{d.suhu}°C</b>
              </div>
            ))}
          </div>
        )}

        {halaman === 'riwayat' && (
  <div style={{ background: 'white', borderRadius: 18, padding: 16 }}>
    <h2 style={{ marginTop: 0, fontSize: 24, fontWeight: 900}}>🧾 Rincian Riwayat Transaksi</h2>

    {/* ===== BALANCE UANG ===== */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
      <div style={{ background: '#F0FDF4', padding: 14, borderRadius: 12 }}>
        <div style={{ fontSize: 11, color: '#64748B' }}>Uang Masuk (Total Bayar)</div>
        <b style={{ fontSize: 18, color: '#059669' }}>Rp {transaksis.reduce((a, t) => a + (t.bayar || 0), 0).toLocaleString('id-ID')}</b>
        <div style={{ fontSize: 11, color: '#64748B' }}>Dari pelanggan</div>
      </div>
      <div style={{ background: '#FEF2F2', padding: 14, borderRadius: 12 }}>
        <div style={{ fontSize: 11, color: '#64748B' }}>Uang Keluar (Kembalian)</div>
        <b style={{ fontSize: 18, color: '#DC2626' }}>Rp {transaksis.reduce((a, t) => a + (t.kembalian || 0), 0).toLocaleString('id-ID')}</b>
        <div style={{ fontSize: 11, color: '#64748B' }}>Dikasih ke pelanggan</div>
      </div>
      <div style={{ background: '#EFF6FF', padding: 14, borderRadius: 12 }}>
        <div style={{ fontSize: 11, color: '#64748B' }}>Bersih di Laci (Omset)</div>
        <b style={{ fontSize: 18, color: '#1D4ED8' }}>Rp {transaksis.reduce((a, t) => a + (t.total || 0), 0).toLocaleString('id-ID')}</b>
        <div style={{ fontSize: 11, color: '#64748B' }}>Masuk - Kembalian = Harus sama</div>
      </div>
    </div>
    <p style={{ fontSize: 11, color: '#64748B', marginTop: -8, marginBottom: 12 }}>
      Cek balance: Uang Masuk - Kembalian harus = Omset. Kalau beda, ada selisih di laci.
    </p>

    {transaksis.length === 0 ? <p style={{ color: '#94A3B8' }}>Belum ada transaksi.</p> : transaksis.map(t => (
      <button key={t.id} onClick={() => setDetailTransaksi(t)} style={{ width: '100%', textAlign: 'left', background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
        <span><b>{t.id}</b><div style={{ fontSize: 12, color: '#64748B' }}>{t.tanggal} • {t.items.reduce((a, i) => a + i.qty, 0)} item {t.pasien_nama ? `• ${t.pasien_nama}` : ''}</div>
        <div style={{ fontSize: 11, color: '#64748B' }}>Bayar Rp {(t.bayar || 0).toLocaleString('id-ID')} • Kembali Rp {(t.kembalian || 0).toLocaleString('id-ID')}</div>
        </span>
        <b>Rp {t.total.toLocaleString('id-ID')} →</b>
      </button>
    ))}

      {detailTransaksi && (
        <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 16, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>Struk {detailTransaksi.id}</b><button onClick={() => setDetailTransaksi(null)} style={{ border: 'none', background: 'white', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>✕ Tutup</button></div>
          <p style={{ fontSize: 12, color: '#64748B' }}>{detailTransaksi.tanggal}{detailTransaksi.pasien_nama ? ` • ${detailTransaksi.pasien_nama}` : ''}</p>
          {detailTransaksi.items.map((i, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}><span>{i.nama} x{i.qty}</span><span>Rp {(i.harga * i.qty).toLocaleString('id-ID')}</span></div>)}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}><span>Total Belanja</span><b>Rp {detailTransaksi.total.toLocaleString('id-ID')}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}><span>Uang Diterima (Bayar)</span><span>Rp {(detailTransaksi.bayar || 0).toLocaleString('id-ID')}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#DC2626' }}><span>Uang Keluar (Kembalian)</span><span>- Rp {(detailTransaksi.kembalian || 0).toLocaleString('id-ID')}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, borderTop: '1px solid #E2E8F0', paddingTop: 8, marginTop: 8 }}><span>Bersih Masuk Laci</span><span>Rp {detailTransaksi.total.toLocaleString('id-ID')}</span></div>
        </div>
      )}
    </div>
  )}

      
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 20 }}>RuangApotek v2.1 • Data tersimpan di Supabase • Online</p>
      </div>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }}></div>}
    </div>
  );
}