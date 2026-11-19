import { useState } from 'react';
import Landing from './Landing.jsx';
import Login from './Login.jsx';
import Kasir from './Kasir.jsx';
import SuhuHarian from './SuhuHarian.jsx';
import CetakBarcodeSuhu from './CetakBarcodeSuhu.jsx';
import { supabase } from './supabase';

export default function App() {
  if (window.location.pathname === '/suhu') return <SuhuHarian />;
  if (window.location.pathname === '/cetak-barcode-suhu') return <CetakBarcodeSuhu />;
  const [halaman, setHalaman] = useState('landing');
  const [namaApotekLogin, setNamaApotekLogin] = useState(() => {
    const s = localStorage.getItem('ruangapotek_login');
    return s ? JSON.parse(s).nama : "";
  });

  if (halaman === 'landing') {
    return <Landing onCobaKasir={() => setHalaman('login')} />;
  }

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
 
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'white', fontFamily: 'system-ui' }}>
        <span style={{ fontSize: 13 }}>👋 Halo, <b>{namaApotekLogin || 'Apotek'}</b></span>
        <button onClick={async () => { 
          await supabase.auth.signOut();
          localStorage.removeItem('ruangapotek_login'); 
          setHalaman('login'); 
        }} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Logout</button>
      </div>
      <Kasir />
    </div>
  );
}