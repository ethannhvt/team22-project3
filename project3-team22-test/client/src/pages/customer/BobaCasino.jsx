import React, { useState, useCallback } from 'react';
import Blackjack from './Blackjack';
import Dice from './Dice';
import './Casino.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function BobaCasino({ customer, setCustomer }) {
  const [activeGame, setActiveGame] = useState('blackjack');

  const handlePointsChange = useCallback(async (delta) => {
    if (!customer) return;

    // Optimistically update local state immediately so UI feels fast
    setCustomer(prev => ({
      ...prev,
      points: Math.max(0, prev.points + delta)
    }));

    // Sync with backend
    try {
      await fetch(`${API_BASE}/customers/${customer.phone_number}/points`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });
    } catch (e) {
      console.error('Failed to sync points with server:', e);
    }
  }, [customer, setCustomer]);

  if (!customer) {
    return (
      <div className="casino-gate">
        <div className="casino-gate__icon">🎰</div>
        <h2 className="casino-gate__title">Boba Casino</h2>
        <p className="casino-gate__msg">Sign in with your phone number to access the casino and earn/spend loyalty points!</p>
      </div>
    );
  }

  return (
    <div className="casino">
      <div className="casino__header">
        <h2 className="casino__title">🎰 Boba Casino</h2>
        <p className="casino__balance">⭐ {customer.points.toLocaleString()} pts</p>
      </div>

      <div className="casino__tabs">
        <button
          className={`casino__tab ${activeGame === 'blackjack' ? 'casino__tab--active' : ''}`}
          onClick={() => setActiveGame('blackjack')}
        >
          🃏 Blackjack
        </button>
        <button
          className={`casino__tab ${activeGame === 'dice' ? 'casino__tab--active' : ''}`}
          onClick={() => setActiveGame('dice')}
        >
          🎲 Dice
        </button>
      </div>

      <div className="casino__content">
        {activeGame === 'blackjack' && (
          <Blackjack customer={customer} onPointsChange={handlePointsChange} />
        )}
        {activeGame === 'dice' && (
          <Dice customer={customer} onPointsChange={handlePointsChange} />
        )}
      </div>
    </div>
  );
}
