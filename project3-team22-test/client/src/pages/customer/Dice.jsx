import React, { useState, useRef } from 'react';

// Multiplier formula: 99 / winChance (1% house edge)
function calcMultiplier(winChance) {
  return parseFloat((99 / winChance).toFixed(4));
}

// Profit if win: bet * (multiplier - 1)
function calcProfit(bet, multiplier) {
  return Math.floor(bet * (multiplier - 1));
}

const BET_OPTIONS = [100, 500, 1000, 2500, 5000];
const MIN_WIN_CHANCE = 1;
const MAX_WIN_CHANCE = 98;

export default function Dice({ customer, onPointsChange }) {
  const [bet, setBet] = useState(0);
  const [winChance, setWinChance] = useState(50);   // 1–98
  const [direction, setDirection] = useState('under'); // 'under' | 'over'
  const [rolling, setRolling] = useState(false);
  const [rolledNum, setRolledNum] = useState(null);  // 0.00–100.00
  const [win, setWin] = useState(null);
  const [delta, setDelta] = useState(null);

  const points = customer?.points ?? 0;
  const multiplier = calcMultiplier(winChance);
  const profit = calcProfit(bet, multiplier);

  // Target number derived from direction + winChance
  // Roll Under: must roll < winChance       → target = winChance
  // Roll Over:  must roll > (100-winChance) → target = 100 - winChance
  const target = direction === 'under' ? winChance : 100 - winChance;

  const roll = () => {
    if (!bet || rolling || bet > points) return;
    setRolling(true);
    setRolledNum(null);
    setWin(null);
    setDelta(null);

    // Animate a fast-cycling display for dramatic effect
    let ticks = 0;
    const totalTicks = 18;
    const tickInterval = setInterval(() => {
      setRolledNum(parseFloat((Math.random() * 100).toFixed(2)));
      ticks++;
      if (ticks >= totalTicks) {
        clearInterval(tickInterval);
        // Final result
        const final = parseFloat((Math.random() * 100).toFixed(2));
        setRolledNum(final);

        const didWin = direction === 'under' ? final < target : final > target;
        const pointDelta = didWin ? profit : -bet;
        setWin(didWin);
        setDelta(pointDelta);
        setRolling(false);
        onPointsChange(pointDelta);
      }
    }, 60);
  };

  const reset = () => {
    setRolledNum(null);
    setWin(null);
    setDelta(null);
    setBet(0);
  };

  // Bar: what fraction of 0–100 is the green (winning) zone
  const greenStart = direction === 'under' ? 0 : target;
  const greenEnd   = direction === 'under' ? target : 100;
  const ballPos    = rolledNum !== null ? rolledNum : null;

  return (
    <div className="casino-game dice-game">
      <h3 className="casino-game__title">🎲 Dice</h3>
      <p className="casino-game__balance">Balance: <strong>⭐ {points.toLocaleString()} pts</strong></p>

      {/* ── Result number ── */}
      <div className={`dice-result-number ${win === true ? 'dice-result--win' : win === false ? 'dice-result--lose' : ''}`}>
        {rolledNum !== null ? rolledNum.toFixed(2) : '—'}
      </div>

      {/* ── Combined visual bar + slider (the bar IS draggable) ── */}
      <div className="dice-bar-wrapper">
        <p className="dice-bar-hint">← Drag the bar to set your win chance →</p>
        {/* Green winning zone */}
        <div className="dice-bar">
          <div
            className="dice-bar__lose"
            style={{ width: `${greenStart}%` }}
          />
          <div
            className="dice-bar__win"
            style={{ width: `${greenEnd - greenStart}%` }}
          />
          <div
            className="dice-bar__lose"
            style={{ width: `${100 - greenEnd}%` }}
          />
        </div>
        {/* Transparent range input overlaid on bar — this IS the draggable control */}
        <input
          type="range"
          min={MIN_WIN_CHANCE}
          max={MAX_WIN_CHANCE}
          value={winChance}
          onChange={e => setWinChance(Number(e.target.value))}
          disabled={rolling}
          className="dice-bar-slider"
          title={`Win Chance: ${winChance}%`}
        />
        {/* Ball indicator */}
        {ballPos !== null && (
          <div
            className={`dice-ball ${win ? 'dice-ball--win' : 'dice-ball--lose'}`}
            style={{ left: `${ballPos}%` }}
          >
            {ballPos.toFixed(2)}
          </div>
        )}
        {/* Target marker */}
        <div className="dice-target-marker" style={{ left: `${target}%` }}>
          <div className="dice-target-marker__line" />
          <span className="dice-target-marker__label">{target.toFixed(2)}</span>
        </div>
        {/* Bar labels */}
        <div className="dice-bar-labels">
          <span>0.00</span>
          <span className="dice-bar-labels__chance">Win Chance: <strong>{winChance}%</strong></span>
          <span>100.00</span>
        </div>
      </div>

      {/* ── Direction toggle ── */}
      <div className="dice-direction">
        <button
          className={`dice-dir-btn ${direction === 'under' ? 'dice-dir-btn--active' : ''}`}
          onClick={() => setDirection('under')}
          disabled={rolling}
        >
          Roll Under
        </button>
        <div className="dice-dir-divider">{target.toFixed(2)}</div>
        <button
          className={`dice-dir-btn ${direction === 'over' ? 'dice-dir-btn--active' : ''}`}
          onClick={() => setDirection('over')}
          disabled={rolling}
        >
          Roll Over
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="dice-controls">
        <div className="dice-stat-row">
          <div className="dice-stat dice-stat--box">
            <span className="dice-stat__label">Multiplier</span>
            <span className="dice-stat__value dice-stat__value--gold">{multiplier.toFixed(2)}×</span>
          </div>
          <div className="dice-stat dice-stat--box">
            <span className="dice-stat__label">Profit on Win</span>
            <span className="dice-stat__value dice-stat__value--green">+{profit.toLocaleString()} pts</span>
          </div>
        </div>
      </div>

      {/* ── Bet chips ── */}
      <div className="casino-bet">
        <p className="casino-bet__label">Bet:</p>
        <div className="casino-bet__chips">
          {BET_OPTIONS.map(amt => (
            <button
              key={amt}
              className={`casino-chip ${bet === amt ? 'casino-chip--active' : ''} ${amt > points ? 'casino-chip--disabled' : ''}`}
              onClick={() => !rolling && setBet(amt)}
              disabled={amt > points || rolling}
            >
              {amt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Result banner ── */}
      {win !== null && !rolling && (
        <div className={`dice-banner ${win ? 'dice-banner--win' : 'dice-banner--lose'}`}>
          {win
            ? `🎉 Win! +${profit.toLocaleString()} pts`
            : `💥 Lose! -${bet.toLocaleString()} pts`}
        </div>
      )}

      {/* ── Roll button ── */}
      <button
        className="casino-deal-btn"
        style={{ marginTop: 16, width: '100%' }}
        onClick={win !== null ? reset : roll}
        disabled={!bet || rolling}
      >
        {rolling ? 'Rolling...' : win !== null ? 'Roll Again' : `🎲 Roll (${direction === 'under' ? 'Under' : 'Over'} ${target.toFixed(2)})`}
      </button>
    </div>
  );
}
