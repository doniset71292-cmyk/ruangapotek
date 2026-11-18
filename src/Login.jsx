import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isDaftar, setIsDaftar] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) return alert('Isi username & password dulu')
    
    // TRIK: username diubah jadi email palsu
    const emailPalsu = username.toLowerCase().trim() + '@yakrija.id'

    if (isDaftar) {
      // MODE DAFTAR APOTEK BARU
      const { error } = await supabase.auth.signUp({ email: emailPalsu, password })
      if (error) return alert('Gagal daftar: ' + error.message)
      alert('Akun ' + username + ' berhasil dibuat! Sekarang silahkan login.')
      setIsDaftar(false)
    } else {
      // MODE LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email: emailPalsu, password })
      if (error) return alert('Login gagal: Username / password salah')
      navigate('/kasir')
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 20, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2563eb' }}>💊 Ruang Apotek</h1>
      <p>{isDaftar ? 'Daftar Akun Apotek Baru' : 'Login Kasir'}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Username apotek (misal: yakrija)" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
        <button style={{ padding: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>
          {isDaftar ? 'Buat Akun' : 'Masuk'}
        </button>
      </form>
      <p onClick={() => setIsDaftar(!isDaftar)} style={{ color: '#2563eb', cursor: 'pointer', fontSize: 13, marginTop: 16 }}>
        {isDaftar ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar apotek baru'}
      </p>
    </div>
  )
}