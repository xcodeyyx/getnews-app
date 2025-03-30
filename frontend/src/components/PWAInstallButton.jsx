import { useState } from 'react';

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Trigger saat browser mendeteksi PWA
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setDeferredPrompt(e);
  });

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User installed PWA');
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <button 
      onClick={handleInstallClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 20px',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      Install App
    </button>
  );
}