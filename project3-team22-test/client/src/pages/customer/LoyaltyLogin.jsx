import React from 'react';

export default function LoyaltyLogin({ onLogin, onSkip }) {
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const handleLogin = async () => {
    if (phone.length !== 10) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/customers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.phone_number) {
        onLogin(data);
      }
    } catch (e) {
      console.error('Loyalty login error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (key) => {
    if (key === 'Clear') { setPhone(''); return; }
    if (key === '⌫') { setPhone(p => p.slice(0, -1)); return; }
    if (phone.length < 10) setPhone(p => p + key);
  };

  const formatted = phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') || 'Enter phone number';

  return (
    <div className="loyalty-overlay">
      <div className="loyalty-modal">
        <div className="loyalty-modal__icon">🐉</div>
        <h2 className="loyalty-modal__title">Dragon Boba Rewards</h2>
        <p className="loyalty-modal__subtitle">Earn 100 points per $1 spent. Redeem for discounts!</p>

        <div className="loyalty-modal__display">{formatted}</div>

        <div className="loyalty-modal__numpad">
          {[1,2,3,4,5,6,7,8,9,'Clear',0,'⌫'].map(key => (
            <button
              key={key}
              className={`loyalty-modal__key ${typeof key === 'string' ? 'loyalty-modal__key--action' : ''}`}
              onClick={() => handleKey(key)}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="loyalty-modal__actions">
          <button
            className="loyalty-modal__btn loyalty-modal__btn--primary"
            onClick={handleLogin}
            disabled={phone.length !== 10 || loading}
          >
            {loading ? 'Loading...' : '✓ Sign In / Join'}
          </button>
          <button
            className="loyalty-modal__btn loyalty-modal__btn--ghost"
            onClick={onSkip}
          >
            Skip (Guest)
          </button>
        </div>
      </div>
    </div>
  );
}
