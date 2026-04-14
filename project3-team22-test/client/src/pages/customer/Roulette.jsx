import React, { useState } from 'react';

// American roulette numbers in order around the wheel
const WHEEL_NUMBERS = [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, 37, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2];
// 37 = 00 in American roulette

const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function getColor(n) {
  if (n === 0 || n === 37) return 'green';
  return RED_NUMS.has(n) ? 'red' : 'black';
}

function displayNum(n) {
  return n === 37 ? '00' : String(n);
}

const BET_OPTIONS = [100, 500, 1000, 2500, 5000];

const BET_TYPES = [
  { label: '🔴 Red', key: 'red', payout: 2 },
  { label: '⚫ Black', key: 'black', payout: 2 },
  { label: '🔢 Odd', key: 'odd', payout: 2 },
  { label: '🔣 Even', key: 'even', payout: 2 },
];

export default function Roulette({ customer, onPointsChange }) {
  const [bet, setBet] = useState(0);
  const [betType, setBetType] = useState(null);   // 'red'|'black'|'odd'|'even'|number
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);      // { number, color, message, delta }
  const [rotation, setRotation] = useState(0);

  const points = customer?.points ?? 0;

  const spin = () => {
    if (!bet || betType === null || spinning) return;
    setSpinning(true);
    setResult(null);

    const landed = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];
    const color = getColor(landed);

    // Wheel spins a random number of full rotations (purely decorative)
    const extraSpins = (6 + Math.floor(Math.random() * 5)) * 360;
    setRotation(prev => prev + extraSpins);

    setTimeout(() => {
      let win = false;
      if (betType === 'red') win = color === 'red';
      else if (betType === 'black') win = color === 'black';
      else if (betType === 'odd') win = landed !== 0 && landed !== 37 && landed % 2 === 1;
      else if (betType === 'even') win = landed !== 0 && landed !== 37 && landed % 2 === 0;
      else win = betType === landed; // number bet

      const payout = typeof betType === 'number' ? 36 : 2;
      const delta = win ? bet * (payout - 1) : -bet;
      const numDisplay = displayNum(landed);
      const colorLabel = color === 'green' ? '🟢' : color === 'red' ? '🔴' : '⚫';
      const msg = win
        ? `🎉 ${colorLabel} ${numDisplay}! You win ${(bet * (payout - 1)).toLocaleString()} pts!`
        : `😔 ${colorLabel} ${numDisplay}. You lost ${bet.toLocaleString()} pts.`;

      setResult({ number: landed, color, message: msg, delta, win });
      onPointsChange(delta);
      setSpinning(false);
    }, 3500);
  };

  const reset = () => {
    setBet(0);
    setBetType(null);
    setResult(null);
  };

  const bgColor = result
    ? result.win ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)'
    : 'transparent';

  return (
    <div className="casino-game" style={{ background: bgColor, transition: 'background 0.5s' }}>
      <h3 className="casino-game__title">🎰 Roulette</h3>
      <p className="casino-game__balance">Your Balance: <strong>⭐ {points.toLocaleString()} pts</strong></p>

      {/* Wheel + Result Display */}
      <div className="roulette-wheel-wrapper">
        <div
          className="roulette-wheel"
          style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3.5s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}
        />
        {/* Center number display — shows ? while spinning, then the landed number */}
        <div
          className="roulette-result-bubble"
          style={{
            background: spinning ? '#333' : result
              ? result.color === 'red' ? '#E74C3C'
              : result.color === 'green' ? '#27AE60'
              : '#1a1a1a'
              : '#333'
          }}
        >
          {spinning ? '?' : result ? displayNum(result.number) : '?'}
        </div>
        {/* Fixed pointer */}
        <div className="roulette-pointer">▼</div>
      </div>

      {/* Bet Amount */}
      <div className="casino-bet">
        <p className="casino-bet__label">Bet amount:</p>
        <div className="casino-bet__chips">
          {BET_OPTIONS.map(amt => (
            <button
              key={amt}
              className={`casino-chip ${bet === amt ? 'casino-chip--active' : ''} ${amt > points ? 'casino-chip--disabled' : ''}`}
              onClick={() => !spinning && setBet(amt)}
              disabled={amt > points || spinning}
            >
              {amt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Bet Type */}
      <div className="roulette-bets">
        <p className="casino-bet__label">Bet on:</p>
        <div className="roulette-bet-grid">
          {BET_TYPES.map(b => (
            <button
              key={b.key}
              className={`roulette-bet-btn ${betType === b.key ? 'roulette-bet-btn--active' : ''}`}
              onClick={() => !spinning && setBetType(b.key)}
            >
              {b.label}
              <span className="roulette-payout">×{b.payout}</span>
            </button>
          ))}
        </div>

        {/* Number grid (0-36 + 00) */}
        <div className="roulette-number-grid">
          {[...Array(37).keys()].concat([37]).map(n => {
            const c = getColor(n);
            return (
              <button
                key={n}
                className={`roulette-num-btn roulette-num-btn--${c} ${betType === n ? 'roulette-num-btn--active' : ''}`}
                onClick={() => !spinning && setBetType(n)}
              >
                {displayNum(n)}
              </button>
            );
          })}
        </div>
        <p className="roulette-number-note">Number bet pays ×36</p>
      </div>

      {/* Prominent result display */}
      {result && (
        <div className="roulette-landed">
          <span
            className="roulette-landed__number"
            style={{
              background: result.color === 'red' ? '#E74C3C' : result.color === 'green' ? '#27AE60' : '#222',
              boxShadow: `0 0 24px ${result.color === 'red' ? '#E74C3C' : result.color === 'green' ? '#27AE60' : '#444'}`
            }}
          >
            {displayNum(result.number)}
          </span>
          <p className="casino-result__message" style={{ color: result.win ? '#27AE60' : '#E74C3C', margin: 0 }}>
            {result.message}
          </p>
        </div>
      )}

      <div className="casino-controls" style={{ marginTop: 16 }}>
        {!result ? (
          <button
            className="casino-deal-btn"
            onClick={spin}
            disabled={!bet || betType === null || spinning}
          >
            {spinning ? 'Spinning...' : 'Spin! 🎰'}
          </button>
        ) : (
          <button className="casino-deal-btn" onClick={reset}>Spin Again</button>
        )}
      </div>
    </div>
  );
}
