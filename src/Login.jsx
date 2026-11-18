import { useState } from 'react'
import { supabase } from './supabase'

export default function Login({ onKembali, onLoginSukses }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isDaftar, setIsDaftar] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) return alert('Isi username & password dulu')
    setLoading(true)
    
    const emailPalsu = username.toLowerCase().trim() + '@yakrija.id'

    if (isDaftar) {
      const { error } = await supabase.auth.signUp({ email: emailPalsu, password })
      setLoading(false)
      if (error) return alert('Gagal daftar: ' + error.message)
      alert('Akun ' + username + ' berhasil dibuat! Sekarang silahkan login.')
      setIsDaftar(false)
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailPalsu, password })
      setLoading(false)
      if (error) return alert('Login gagal: Username / password salah')
      // Simpan nama apotek biar App.jsx bisa nampilin "Halo, yakrija"
      localStorage.setItem('ruangapotek_login', JSON.stringify({ nama: username }))
      // Pindah ke Kasir pake cara App.jsx kamu (bukan router)
      if (onLoginSukses) onLoginSukses(username)
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: 20, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#0D9488' }}>💊 Ruang Apotek</h1>
      <p>{isDaftar ? 'Daftar Akun Apotek Baru' : 'Login Kasir'}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Username apotek (mis: yakrija)" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
        <button disabled={loading} style={{ padding: 12, background: '#0D9488', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Loading...' : isDaftar ? 'Buat Akun' : 'Masuk'}
        </button>
      </form>
      <p onClick={() => setIsDaftar(!isDaftar)} style={{ color: '#0D9488', cursor: 'pointer', fontSize: 13, marginTop: 16 }}>
        {isDaftar ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar apotek baru'}
      </p>
      <button onClick={onKembali} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12, marginTop: 8 }}>← Kembali ke Beranda</button>
    </div>
  )
}