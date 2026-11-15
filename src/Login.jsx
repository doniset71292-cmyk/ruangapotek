import React, { useState } from 'react';

export default function Login({ onLoginSukses, onKembali }) {
  const [mode, setMode] = useState('login'); // 'login' atau 'daftar'
  const [namaApotek, setNamaApotek] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");

  const ambilUsers = () => {
    try { return JSON.parse(localStorage.getItem('ruangapotek_users') || '[]'); } catch { return []; }
  };

  const handleDaftar = () => {
    setError(""); setSukses("");
    if (!namaApotek.trim() || !username.trim() || pin.length < 4) {
      return setError("Isi semua! Nama apotek, username, dan PIN minimal 4 digit.");
    }
    const users = ambilUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return setError(`Username "${username}" udah dipakai apotek lain. Coba yang lain ya!`);
    }
    users.push({ namaApotek: namaApotek.trim(), username: username.trim().toLowerCase(), pin });
    localStorage.setItem('ruangapotek_users', JSON.stringify(users));
    setSukses(`Akun ${namaApotek} berhasil dibuat! Silakan login.`);
    setMode('login');
    setPin("");
  };

  const handleLogin = () => {
    setError(""); setSukses("");
    if (!username.trim() || !pin) return setError("Isi username & PIN dulu!");
    const users = ambilUsers();
    const ketemu = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.pin === pin);
    if (!ketemu) return setError("Username / PIN salah. Belum punya akun? Klik Daftar Baru di atas.");

    localStorage.setItem('ruangapotek_login', JSON.stringify({ nama: ketemu.namaApotek, username: ketemu.username }));
    onLoginSukses(ketemu.namaApotek);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F9F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ background: 'white', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <button onClick={onKembali} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, padding: 0 }}>← Kembali ke Website</button>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{ lineHeight: 1 }}>
  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>Ruang</div>
  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, color: '#0D9488' }}>Apotek</div>
</div>
         
          <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>{mode === 'login' ? 'Masuk pakai akun apotek kamu' : 'Gratis, setup cuma 1 menit'}</p>
        </div>

        {/* TOMBOL PINDAH MODE */}
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 999, padding: 4, marginTop: 18 }}>
          <button onClick={() => { setMode('login'); setError(""); setSukses(""); }} style={{ flex: 1, padding: '10px', borderRadius: 999, border: 'none', background: mode === 'login' ? 'white' : 'transparent', fontWeight: 700, cursor: 'pointer', boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Masuk</button>
          <button onClick={() => { setMode('daftar'); setError(""); setSukses(""); }} style={{ flex: 1, padding: '10px', borderRadius: 999, border: 'none', background: mode === 'daftar' ? '#0D9488' : 'transparent', color: mode === 'daftar' ? 'white' : 'black', fontWeight: 700, cursor: 'pointer' }}>Daftar Baru</button>
        </div>

        {mode === 'daftar' && (
          <>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 16 }}>NAMA APOTEK</label>
            <input value={namaApotek} onChange={e => setNamaApotek(e.target.value)} placeholder="Contoh: Apotek Sehat" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', marginTop: 6, boxSizing: 'border-box' }} />
          </>
        )}

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 14 }}>USERNAME</label>
        <input value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())} placeholder="Contoh: apoteksehat" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', marginTop: 6, boxSizing: 'border-box' }} />

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 14 }}>PIN (4-6 Digit)</label>
        <input value={pin} onChange={e => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="••••" inputMode="numeric" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', marginTop: 6, boxSizing: 'border-box', letterSpacing: 4, fontSize: 16 }} />

        {error && <p style={{ color: '#DC2626', fontSize: 12, background: '#FEF2F2', padding: '10px', borderRadius: 10, marginTop: 12 }}>{error}</p>}
        {sukses && <p style={{ color: '#15803D', fontSize: 12, background: '#F0FDF4', padding: '10px', borderRadius: 10, marginTop: 12 }}>{sukses}</p>}

        {mode === 'login' ? (
          <button onClick={handleLogin} style={{ width: '100%', background: '#0D9488', color: 'white', border: 'none', padding: '14px', borderRadius: 999, fontWeight: 800, marginTop: 16, cursor: 'pointer' }}>Masuk ke Dashboard →</button>
        ) : (
          <button onClick={handleDaftar} style={{ width: '100%', background: '#0F766E', color: 'white', border: 'none', padding: '14px', borderRadius: 999, fontWeight: 800, marginTop: 16, cursor: 'pointer' }}>Buat Akun & Mulai Aplikasi →</button>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 14 }}>
          {mode === 'login' ? 'Belum punya akun? Klik Daftar Baru di atas.' : 'Udah punya akun? Klik Masuk di atas.'}
        </p>
      </div>
    </div>
  );
}