import { useState } from 'react'
import { supabase } from './supabase'

export default function Login({ onKembali, onLoginSukses }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isDaftar, setIsDaftar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      const { error } = await supabase.auth.signInWithPassword({ email: emailPalsu, password })
      setLoading(false)
      if (error) return alert('Login gagal: Username / password salah')
      localStorage.setItem('ruangapotek_login', JSON.stringify({ nama: username }))
      if (onLoginSukses) onLoginSukses(username)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 40 }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>

        {/* LOGO R - SAMA KAYAK NAVBAR KASIR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, background: '#0D9488', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 26, fontWeight: 900, fontFamily: 'system-ui', boxShadow: '0 4px 12px rgba(13,148,136,0.3)', letterSpacing: '-1px' }}>
            R
          </div>
          <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>Ruang <span style={{ color: '#0D9488' }}>Apotek</span></div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>KASIR • STOK • SUHU</div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#64748B', fontSize: 13, margin: '12px 0 20px' }}>
          {isDaftar ? 'Daftar Akun Apotek Baru' : 'Masuk untuk lanjut ke Aplikasi'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>USERNAME APOTEK</label>
            <input placeholder="misal: yakrija" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 14 }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>PASSWORD</label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 44px 12px 12px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 14 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '6px 8px' }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button disabled={loading} style={{ marginTop: 4, padding: 13, background: '#0D9488', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Loading...' : isDaftar ? 'Buat Akun' : 'Masuk →'}
          </button>
        </form>

        <p onClick={() => setIsDaftar(!isDaftar)} style={{ textAlign: 'center', color: '#0D9488', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 16 }}>
          {isDaftar ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar apotek baru'}
        </p>
        <button onClick={onKembali} style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}>← Kembali ke Beranda</button>
      </div>
    </div>
  )
}