import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function SuhuHarian() {
  const params = new URLSearchParams(window.location.search);
  const apotek = params.get('apotek') || 'Klinik Pratama Yakrija';
  const ruangan = params.get('ruangan') || 'Ruang Racik';
  
  const [suhu, setSuhu] = useState('');
  const [lembab, setLembab] = useState('');
  const [nama, setNama] = useState('');
  const [shift, setShift] = useState('Pagi (07.00 - 15.00)');
  const [sukses, setSukses] = useState(false);
  const [loading, setLoading] = useState(false);

  // === CEK LOGIN ===
  const [user, setUser] = useState(null);
  const [cekLogin, setCekLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCekLogin(false);
    });
  }, []);

  const handleLoginSuhu = async (e) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) return alert('Isi username & password apotek dulu');
    const emailPalsu = loginForm.username.toLowerCase().trim() + '@yakrija.com';
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailPalsu, password: loginForm.password });
    if (error) return alert('Login gagal: Username / password salah');
    setUser(data.user);
  };

  const suhuNum = parseFloat(suhu);
  const isTidakSesuai = suhu !== '' && (suhuNum < 15 || suhuNum > 25);

  const simpan = async () => {
    if (!suhu || !nama) return alert('Isi suhu & nama dulu ya!');
    if (!user) return alert('Harus login dulu!');
    setLoading(true);
    
    const baru = {
      tanggal: new Date().toLocaleDateString('id-ID'),
      jam: new Date().toLocaleTimeString('id-ID'),
      ruangan, 
      suhu: Number(suhu), 
      lembab: lembab ? Number(lembab) : null, 
      nama, shift,
      status: isTidakSesuai ? 'TIDAK SESUAI' : 'SESUAI',
      apotek_id: user.id
    };
    
    const { error } = await supabase.from('log_suhu').insert([baru]);
    setLoading(false);
    if (error) return alert('Gagal simpan: ' + error.message);
    setSukses(true);
  };

  // === KALAU MASIH CEK LOGIN ===
  if (cekLogin) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'system-ui' }}>Loading...</div>;

  // === KALAU BELUM LOGIN, MINTA LOGIN DULU ===
  if (!user) {
    return (
      <div style={{ maxWidth: 360, margin: '40px auto', padding: 20, fontFamily: 'system-ui', textAlign: 'center' }}>
        <img src="/yakrija.png" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 12 }} />
        <h2 style={{ margin: '8px 0 2px' }}>{apotek}</h2>
        <p style={{ color: '#64748B', fontSize: 13 }}>Login dulu buat input suhu • {ruangan}</p>
        <form onSubmit={handleLoginSuhu} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <input placeholder="Username apotek (mis: yakrija)" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} style={{ padding: 12, borderRadius: 12, border: '1px solid #E2E8F0' }} />
          <input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} style={{ padding: 12, borderRadius: 12, border: '1px solid #E2E8F0' }} />
          <button style={{ background: '#0D9488', color: 'white', border: 'none', padding: 14, borderRadius: 999, fontWeight: 800 }}>Masuk →</button>
        </form>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 12 }}>Pake akun apotek yang sama kayak di kasir.<br/>Biar datanya masuk ke laporan yang bener.</p>
      </div>
    );
  }

  if (sukses) return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20, textAlign: 'center', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 60 }}>✅</div>
      <h2>Tersimpan!</h2>
      <p>Suhu {suhu}°C - {ruangan} - {shift}<br/>Dicatat jam {new Date().toLocaleTimeString('id-ID')}</p>
      <p style={{ fontSize: 12, color: '#64748B' }}>Silakan lanjut tugas. Data bisa dilihat owner di laporan.</p>
      <button onClick={() => { setSukses(false); setSuhu(''); setLembab(''); }} style={{ background: '#0D9488', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 999, fontWeight: 700 }}>Input Lagi</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20, fontFamily: 'system-ui', background: '#F0F9F7', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/yakrija.png" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 12 }} />
        <h2 style={{ margin: '8px 0 2px' }}>{apotek}</h2>
        <p style={{ margin: 0, color: '#64748B', fontSize: 13 }}>Pencatatan Suhu Harian • {ruangan}</p>
        <p style={{ fontSize: 12, color: '#0F766E', fontWeight: 700 }}>📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} • {new Date().toLocaleTimeString('id-ID')}</p>
        <p style={{ fontSize: 11, color: '#94A3B8' }}>Login sebagai: {user.email}</p>
      </div>

      <label style={{ fontWeight: 700, fontSize: 13 }}>SHIFT</label>
      <select value={shift} onChange={e => setShift(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0', margin: '6px 0 14px' }}>
        <option>Pagi (07.00 - 15.00)</option>
        <option>Siang (15.00 - 22.00)</option>
        <option>Malam (22.00 - 07.00)</option>
      </select>

      <label style={{ fontWeight: 700, fontSize: 13 }}>SUHU RUANGAN (°C)</label>
      <input type="number" inputMode="decimal" placeholder="Contoh: 22.5" value={suhu} onChange={e => setSuhu(e.target.value)} style={{ width: '100%', padding: 14, fontSize: 20, fontWeight: 800, borderRadius: 12, border: isTidakSesuai ? '2px solid #DC2626' : '1px solid #E2E8F0', margin: '6px 0 4px', boxSizing: 'border-box', textAlign: 'center' }} />
      {isTidakSesuai && <p style={{ color: '#DC2626', fontSize: 12, fontWeight: 700, margin: '0 0 10px' }}>⚠️ Suhu di luar standar 15-25°C! Cek AC & laporkan ke penanggung jawab.</p>}
      {!isTidakSesuai && suhu !== '' && <p style={{ color: '#059669', fontSize: 12, fontWeight: 700, margin: '0 0 10px' }}>✅ Suhu sesuai standar (15-25°C)</p>}

      <label style={{ fontWeight: 700, fontSize: 13 }}>KELEMBABAN (%) - Opsional</label>
      <input type="number" placeholder="Contoh: 60" value={lembab} onChange={e => setLembab(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0', margin: '6px 0 14px', boxSizing: 'border-box' }} />

      <label style={{ fontWeight: 700, fontSize: 13 }}>NAMA PETUGAS</label>
      <input placeholder="Nama yang jaga shift ini" value={nama} onChange={e => setNama(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0', margin: '6px 0 16px', boxSizing: 'border-box' }} />

      <button onClick={simpan} disabled={loading} style={{ width: '100%', background: '#0D9488', color: 'white', border: 'none', padding: 14, borderRadius: 999, fontWeight: 800, fontSize: 15, opacity: loading ? 0.6 : 1 }}>{loading ? 'Menyimpan...' : 'Simpan Laporan Suhu →'}</button>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 12 }}>Data tersimpan di Supabase & tidak bisa diubah (untuk audit)</p>
    </div>
  );
}