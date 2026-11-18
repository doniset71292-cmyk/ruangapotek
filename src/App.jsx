import { useState } from 'react';
import Landing from './Landing.jsx';
import Login from './Login.jsx';
import Kasir from './Kasir.jsx';
import SuhuHarian from './SuhuHarian.jsx';
import CetakBarcodeSuhu from './CetakBarcodeSuhu.jsx';

export default function App() {
  if (window.location.pathname === '/suhu') return <SuhuHarian />;
  if (window.location.pathname === '/cetak-barcode-suhu') return <CetakBarcodeSuhu />;
  const [halaman, setHalaman] = useState('landing');
  const [namaApotekLogin, setNamaApotekLogin] = useState(() => {
    const s = localStorage.getItem('ruangapotek_login');
    return s ? JSON.parse(s).nama : "";
  });

  // LANDING
  if (halaman === 'landing') {
    return <Landing onCobaKasir={() => setHalaman('login')} />;
  }

  // LOGIN
  if (halaman === 'login') {
    return (
      <Login
        onKembali={() => setHalaman('landing')}
        onLoginSukses={(nama) => {
          setNamaApotekLogin(nama);
          setHalaman('kasir');
        }}
      />
    );
  }
 
  // KASIR - Harus login dulu
  return (
    
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'white', fontFamily: 'system-ui' }}>
        <span style={{ fontSize: 13 }}>👋 Halo, <b>{namaApotekLogin || 'Apotek'}</b></span>
        <button onClick={() => { localStorage.removeItem('ruangapotek_login'); setHalaman('landing'); }} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Logout</button>
      </div>
      <Kasir />
    </div>
  );
}