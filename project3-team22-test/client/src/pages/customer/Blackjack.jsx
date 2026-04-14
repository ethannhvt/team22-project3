import React, { useState, useCallback } from 'react';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const val of VALUES)
      deck.push({ suit, val });
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.val)) return 10;
  if (card.val === 'A') return 11;
  return parseInt(card.val);
}

function handTotal(hand) {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter(c => c.val === 'A').length;
  while (total > 21 && aces-- > 0) total -= 10;
  return total;
}

const BET_OPTIONS = [100, 500, 1000, 2500, 5000];
const REVEAL_DELAY_MS = 700; // ms between each card reveal

export default function Blackjack({ customer, onPointsChange }) {
  const [phase, setPhase] = useState('bet'); // bet | playing | revealing | result
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  // Full dealer hand (always complete once game starts), and how many cards are currently visible
  const [dealerHand, setDealerHand] = useState([]);
  const [dealerVisible, setDealerVisible] = useState(1); // only show 1st card during playing
  const [bet, setBet] = useState(0);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  const points = customer?.points ?? 0;

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > points) return;
    const d = buildDeck();
    const p = [d.pop(), d.pop()];
    const dealer = [d.pop(), d.pop()];
    setDeck(d);
    setPlayerHand(p);
    setDealerHand(dealer);
    setDealerVisible(1); // hide hole card
    setResult(null);
    setMessage('');

    if (handTotal(p) === 21) {
      // Instant blackjack — reveal all and resolve
      revealDealerCards(dealer, d, p, true);
    } else {
      setPhase('playing');
    }
  }, [bet, points]);

  /**
   * Build the complete dealer hand (with all draws),
   * then reveal cards one at a time with delays.
   */
  const revealDealerCards = (dHand, d, pHand, isBlackjack = false) => {
    // Build full dealer hand first
    let finalDealer = [...dHand];
    let finalDeck = [...d];
    while (handTotal(finalDealer) < 17) {
      finalDealer.push(finalDeck.pop());
    }
    setDealerHand(finalDealer);
    setPhase('revealing');

    // Reveal each card with a delay
    for (let i = 1; i < finalDealer.length; i++) {
      setTimeout(() => {
        setDealerVisible(i + 1);

        // After last card is revealed, finalize result
        if (i === finalDealer.length - 1) {
          setTimeout(() => {
            finalizeResult(pHand, finalDealer, isBlackjack);
          }, 500);
        }
      }, i * REVEAL_DELAY_MS);
    }
  };

  const finalizeResult = (pHand, finalDealer, isBlackjack) => {
    const pTotal = handTotal(pHand);
    const dTotal = handTotal(finalDealer);

    let outcome, delta, msg;
    if (isBlackjack) {
      outcome = 'blackjack'; delta = Math.floor(bet * 1.5); msg = `🃏 Blackjack! You win ${delta.toLocaleString()} pts!`;
    } else if (pTotal > 21) {
      outcome = 'bust'; delta = -bet; msg = `💥 Bust! You lost ${bet.toLocaleString()} pts.`;
    } else if (dTotal > 21) {
      outcome = 'win'; delta = bet; msg = `🎉 Dealer busts! You win ${bet.toLocaleString()} pts!`;
    } else if (pTotal > dTotal) {
      outcome = 'win'; delta = bet; msg = `🎉 You win ${bet.toLocaleString()} pts!`;
    } else if (dTotal > pTotal) {
      outcome = 'lose'; delta = -bet; msg = `😔 Dealer wins. You lost ${bet.toLocaleString()} pts.`;
    } else {
      outcome = 'push'; delta = 0; msg = `🤝 Push! Bet returned.`;
    }

    setResult(outcome);
    setMessage(msg);
    setPhase('result');
    onPointsChange(delta);
  };

  const hit = () => {
    const newCard = deck[deck.length - 1];
    const newDeck = deck.slice(0, -1);
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck(newDeck);
    if (handTotal(newHand) > 21) {
      // Player busted — still reveal dealer cards dramatically before showing result
      revealDealerCards(dealerHand, newDeck, newHand);
    }
  };

  const stand = () => {
    revealDealerCards(dealerHand, deck, playerHand);
  };

  const reset = () => {
    setPhase('bet');
    setBet(0);
    setPlayerHand([]);
    setDealerHand([]);
    setDealerVisible(1);
    setResult(null);
    setMessage('');
  };

  const resultColors = { win: '#27AE60', blackjack: '#F1C40F', push: '#888', bust: '#E74C3C', lose: '#E74C3C' };

  const isRevealing = phase === 'revealing';
  const showAll = phase === 'result' || phase === 'revealing';

  return (
    <div className="casino-game">
      <h3 className="casino-game__title">🃏 Blackjack</h3>
      <p className="casino-game__balance">Your Balance: <strong>⭐ {points.toLocaleString()} pts</strong></p>

      {phase === 'bet' && (
        <div className="casino-bet">
          <p className="casino-bet__label">Place your bet:</p>
          <div className="casino-bet__chips">
            {BET_OPTIONS.map(amt => (
              <button
                key={amt}
                className={`casino-chip ${bet === amt ? 'casino-chip--active' : ''} ${amt > points ? 'casino-chip--disabled' : ''}`}
                onClick={() => setBet(amt)}
                disabled={amt > points}
              >
                {amt.toLocaleString()}
              </button>
            ))}
          </div>
          {bet > 0 && (
            <button className="casino-deal-btn" onClick={startGame}>
              Deal Cards →
            </button>
          )}
        </div>
      )}

      {(phase === 'playing' || phase === 'revealing' || phase === 'result') && (
        <div className="casino-table">
          {/* Dealer Hand */}
          <div className="casino-hand casino-hand--dealer">
            <p className="casino-hand__label">
              Dealer {phase === 'result' ? `(${handTotal(dealerHand)})` : isRevealing ? '(...)' : '(?)'}
            </p>
            <div className="casino-cards">
              {dealerHand.map((c, i) => {
                const visible = i < dealerVisible && showAll; // only show cards up to dealerVisible count during reveal
                const faceUp = phase === 'playing' ? i === 0 : i < dealerVisible;
                if (phase === 'playing') {
                  // During player's turn: first card up, rest face-down
                  return i === 0
                    ? <div key={i} className="casino-card">
                        <span>{c.val}</span><span>{c.suit}</span>
                      </div>
                    : <div key={i} className="casino-card casino-card--face-down">🂠</div>;
                } else {
                  // Revealing or result: show up to dealerVisible
                  return i < dealerVisible
                    ? <div key={i} className={`casino-card casino-card--deal-in ${c.suit === '♥' || c.suit === '♦' ? 'casino-card--red' : ''}`}>
                        <span>{c.val}</span><span>{c.suit}</span>
                      </div>
                    : <div key={i} className="casino-card casino-card--face-down">🂠</div>;
                }
              })}
            </div>
          </div>

          {/* Player Hand */}
          <div className="casino-hand casino-hand--player">
            <p className="casino-hand__label">You ({handTotal(playerHand)})</p>
            <div className="casino-cards">
              {playerHand.map((c, i) => (
                <div key={i} className={`casino-card ${c.suit === '♥' || c.suit === '♦' ? 'casino-card--red' : ''}`}>
                  <span>{c.val}</span>
                  <span>{c.suit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          {phase === 'playing' && (
            <div className="casino-controls">
              <button className="casino-btn casino-btn--hit" onClick={hit}>Hit</button>
              <button className="casino-btn casino-btn--stand" onClick={stand}>Stand</button>
            </div>
          )}

          {phase === 'revealing' && (
            <p style={{ textAlign: 'center', color: '#D4A847', fontWeight: 700 }}>Dealer is drawing...</p>
          )}

          {phase === 'result' && (
            <div className="casino-result" style={{ color: resultColors[result] }}>
              <p className="casino-result__message">{message}</p>
              <button className="casino-deal-btn" onClick={reset}>Play Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
