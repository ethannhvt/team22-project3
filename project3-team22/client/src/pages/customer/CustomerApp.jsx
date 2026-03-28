import { useState, useEffect, useCallback } from 'react'
import './Customer.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'


// Category emoji mapping for visual flair
const categoryIcons = {
  'Milk Tea': '🧋',
  'Fruit Tea': '🍊',
  'Slush': '🧊',
  'Seasonal': '🌸',
  'Classic': '☕',
  'Special': '⭐',
  'Coffee': '☕',
  'Smoothie': '🥤',
  'Creama': '🍦',
}

function getCategoryIcon(category) {
  return categoryIcons[category] || '🍵'
}

// Customization options
const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%']
const ICE_LEVELS = ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice']
const TOPPINGS = [
  { name: 'None', price: 0 },
  { name: 'Boba', price: 0.50 },
  { name: 'Lychee Jelly', price: 0.50 },
  { name: 'Pudding', price: 0.50 },
]

const ICE_ICONS = {
  'No Ice': '🚫',
  'Less Ice': '❄️',
  'Regular Ice': '❄️❄️',
  'Extra Ice': '❄️❄️❄️',
}

export default function CustomerApp() {
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Navigation state
  const [view, setView] = useState('categories') // categories | items | customize | cart | checkout | confirmation
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  // Customization state
  const [sugar, setSugar] = useState('100%')
  const [ice, setIce] = useState('Regular Ice')
  const [topping, setTopping] = useState('None')

  // Cart state
  const [cart, setCart] = useState([])

  // Checkout state
  const [orderResult, setOrderResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch menu on mount
  useEffect(() => {
    fetch(`${API_BASE}/menu`)
      .then(r => r.json())
      .then(data => {
        setMenu(data)
        const cats = [...new Set(data.filter(i => i.category !== 'Add-on').map(i => i.category))]
        if (!cats.includes('Seasonal')) cats.push('Seasonal')
        setCategories(cats)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load menu:', err)
        setLoading(false)
      })
  }, [])

  // Cart helpers
  const cartCount = cart.length
  const cartSubtotal = cart.reduce((sum, item) => sum + item.finalPrice, 0)
  const cartTax = cartSubtotal * 0.0825
  const cartTotal = cartSubtotal + cartTax

  const addToCart = useCallback(() => {
    const toppingObj = TOPPINGS.find(t => t.name === topping)
    const finalPrice = selectedItem.price + (toppingObj?.price || 0)
    setCart(prev => [...prev, {
      id: Date.now() + Math.random(),
      menuItemId: selectedItem.menu_item_id,
      name: selectedItem.item_name,
      basePrice: selectedItem.price,
      finalPrice,
      sugarLevel: sugar,
      iceLevel: ice,
      topping,
    }])
    // Reset and go back to categories
    setSugar('100%')
    setIce('Regular Ice')
    setTopping('None')
    setView('categories')
  }, [selectedItem, sugar, ice, topping])

  const removeFromCart = useCallback((itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId))
  }, [])

  const submitOrder = useCallback(async (paymentMethod) => {
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            menuItemId: item.menuItemId,
            finalPrice: item.finalPrice,
            basePrice: item.basePrice,
            sugarLevel: item.sugarLevel,
            iceLevel: item.iceLevel,
            topping: item.topping,
          })),
          paymentMethod,
          employeeId: 0, // Self-service kiosk
        }),
      })
      const data = await response.json()
      if (data.success) {
        setOrderResult(data)
        setCart([])
        setView('confirmation')
      } else {
        alert('Order failed. Please try again.')
      }
    } catch (err) {
      console.error('Order submission error:', err)
      alert('Connection error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [cart])

  // Auto-return from confirmation
  useEffect(() => {
    if (view === 'confirmation') {
      const timer = setTimeout(() => {
        setOrderResult(null)
        setView('categories')
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [view])

  // Get items for current category
  const categoryItems = menu.filter(i => i.category === selectedCategory)

  // Calculate live price during customization
  const customizePrice = selectedItem
    ? selectedItem.price + (TOPPINGS.find(t => t.name === topping)?.price || 0)
    : 0

  if (loading) {
    return (
      <div className="kiosk">
        <div className="kiosk__loading">
          <div className="kiosk__loading-spinner" />
          <p>Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="kiosk">
      {/* Header */}
      <header className="kiosk__header">
        <div className="kiosk__header-brand">
          <span className="kiosk__header-icon">🐉</span>
          <h1 className="kiosk__header-title">Dragon Boba</h1>
        </div>
        {view !== 'confirmation' && (
          <button
            className="kiosk__cart-btn"
            onClick={() => setView('cart')}
          >
            <span className="kiosk__cart-icon">🛒</span>
            {cartCount > 0 && (
              <span className="kiosk__cart-badge">{cartCount}</span>
            )}
            <span className="kiosk__cart-total">
              ${cartSubtotal.toFixed(2)}
            </span>
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="kiosk__main">
        {/* ===== CATEGORIES VIEW ===== */}
        {view === 'categories' && (
          <div className="kiosk__categories fade-in">
            <h2 className="kiosk__section-title">What are you in the mood for?</h2>
            <div className="kiosk__category-grid">
              {categories.map((cat, i) => (
                <button
                  key={cat}
                  className="kiosk__category-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => {
                    setSelectedCategory(cat)
                    setView('items')
                  }}
                >
                  <span className="kiosk__category-icon">{getCategoryIcon(cat)}</span>
                  <span className="kiosk__category-name">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== ITEMS VIEW ===== */}
        {view === 'items' && (
          <div className="kiosk__items fade-in">
            <button
              className="kiosk__back-btn"
              onClick={() => setView('categories')}
            >
              ← Back to Menu
            </button>
            <h2 className="kiosk__section-title">{getCategoryIcon(selectedCategory)} {selectedCategory}</h2>
            <div className="kiosk__items-grid">
              {categoryItems.length === 0 ? (
                <p className="kiosk__empty-msg">No items available in this category yet.</p>
              ) : (
                categoryItems.map((item, i) => (
                  <button
                    key={item.menu_item_id}
                    className="kiosk__item-card"
                    style={{ animationDelay: `${i * 0.05}s` }}
                    onClick={() => {
                      setSelectedItem(item)
                      setSugar('100%')
                      setIce('Regular Ice')
                      setTopping('None')
                      setView('customize')
                    }}
                  >
                    <div className="kiosk__item-image-placeholder">
                      <span>{getCategoryIcon(item.category)}</span>
                    </div>
                    <div className="kiosk__item-info">
                      <span className="kiosk__item-name">{item.item_name}</span>
                      <span className="kiosk__item-price">${item.price.toFixed(2)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== CUSTOMIZE VIEW ===== */}
        {view === 'customize' && selectedItem && (
          <div className="kiosk__customize fade-in">
            <button
              className="kiosk__back-btn"
              onClick={() => setView('items')}
            >
              ← Back to {selectedCategory}
            </button>

            <div className="kiosk__customize-layout">
              <div className="kiosk__customize-header">
                <div className="kiosk__customize-item-icon">
                  {getCategoryIcon(selectedItem.category)}
                </div>
                <div>
                  <h2 className="kiosk__customize-title">{selectedItem.item_name}</h2>
                  <p className="kiosk__customize-base-price">Starting at ${selectedItem.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Sugar Level */}
              <div className="kiosk__option-group">
                <h3 className="kiosk__option-label">Sugar Level</h3>
                <div className="kiosk__option-row">
                  {SUGAR_LEVELS.map(level => (
                    <button
                      key={level}
                      className={`kiosk__option-btn ${sugar === level ? 'kiosk__option-btn--active' : ''}`}
                      onClick={() => setSugar(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ice Level */}
              <div className="kiosk__option-group">
                <h3 className="kiosk__option-label">Ice Level</h3>
                <div className="kiosk__option-row">
                  {ICE_LEVELS.map(level => (
                    <button
                      key={level}
                      className={`kiosk__option-btn kiosk__option-btn--ice ${ice === level ? 'kiosk__option-btn--active' : ''}`}
                      onClick={() => setIce(level)}
                    >
                      <span className="kiosk__option-icon">{ICE_ICONS[level]}</span>
                      <span>{level}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toppings */}
              <div className="kiosk__option-group">
                <h3 className="kiosk__option-label">Add a Topping</h3>
                <div className="kiosk__option-row">
                  {TOPPINGS.map(top => (
                    <button
                      key={top.name}
                      className={`kiosk__option-btn kiosk__option-btn--topping ${topping === top.name ? 'kiosk__option-btn--active' : ''}`}
                      onClick={() => setTopping(top.name)}
                    >
                      <span>{top.name}</span>
                      {top.price > 0 && (
                        <span className="kiosk__option-price">+${top.price.toFixed(2)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Add to Cart Footer */}
            <div className="kiosk__customize-footer">
              <div className="kiosk__customize-total">
                ${customizePrice.toFixed(2)}
              </div>
              <button className="kiosk__add-to-cart-btn" onClick={addToCart}>
                Add to Cart
              </button>
            </div>
          </div>
        )}

        {/* ===== CART VIEW ===== */}
        {view === 'cart' && (
          <div className="kiosk__cart fade-in">
            <button
              className="kiosk__back-btn"
              onClick={() => setView('categories')}
            >
              ← Continue Shopping
            </button>
            <h2 className="kiosk__section-title">Your Order</h2>

            {cart.length === 0 ? (
              <div className="kiosk__cart-empty">
                <span className="kiosk__cart-empty-icon">🧋</span>
                <p>Your cart is empty</p>
                <button
                  className="kiosk__browse-btn"
                  onClick={() => setView('categories')}
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                <div className="kiosk__cart-items">
                  {cart.map((item, i) => (
                    <div
                      key={item.id}
                      className="kiosk__cart-item"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="kiosk__cart-item-info">
                        <h3 className="kiosk__cart-item-name">{item.name}</h3>
                        <div className="kiosk__cart-item-details">
                          <span>{item.sugarLevel} Sugar</span>
                          <span>•</span>
                          <span>{item.iceLevel}</span>
                          {item.topping !== 'None' && (
                            <>
                              <span>•</span>
                              <span>{item.topping}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="kiosk__cart-item-right">
                        <span className="kiosk__cart-item-price">${item.finalPrice.toFixed(2)}</span>
                        <button
                          className="kiosk__cart-remove-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="kiosk__cart-summary">
                  <div className="kiosk__cart-line">
                    <span>Subtotal</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="kiosk__cart-line">
                    <span>Tax (8.25%)</span>
                    <span>${cartTax.toFixed(2)}</span>
                  </div>
                  <div className="kiosk__cart-line kiosk__cart-line--total">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    className="kiosk__checkout-btn"
                    onClick={() => setView('checkout')}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== CHECKOUT VIEW ===== */}
        {view === 'checkout' && (
          <div className="kiosk__checkout fade-in">
            <button
              className="kiosk__back-btn"
              onClick={() => setView('cart')}
            >
              ← Back to Cart
            </button>
            <h2 className="kiosk__section-title">How would you like to pay?</h2>
            <p className="kiosk__checkout-total-display">
              Total: <strong>${cartTotal.toFixed(2)}</strong>
            </p>

            <div className="kiosk__payment-grid">
              {[
                { method: 'Cash', icon: '💵', desc: 'Pay at counter' },
                { method: 'Credit', icon: '💳', desc: 'Credit card' },
                { method: 'Debit', icon: '🏧', desc: 'Debit card' },
              ].map(p => (
                <button
                  key={p.method}
                  className="kiosk__payment-card"
                  disabled={submitting}
                  onClick={() => submitOrder(p.method)}
                >
                  <span className="kiosk__payment-icon">{p.icon}</span>
                  <span className="kiosk__payment-method">{p.method}</span>
                  <span className="kiosk__payment-desc">{p.desc}</span>
                </button>
              ))}
            </div>
            {submitting && (
              <div className="kiosk__submitting">
                <div className="kiosk__loading-spinner" />
                <p>Placing your order...</p>
              </div>
            )}
          </div>
        )}

        {/* ===== CONFIRMATION VIEW ===== */}
        {view === 'confirmation' && orderResult && (
          <div className="kiosk__confirmation fade-in">
            <div className="kiosk__confirmation-card">
              <div className="kiosk__confirmation-check">✓</div>
              <h2 className="kiosk__confirmation-title">Order Placed!</h2>
              <p className="kiosk__confirmation-order-id">
                Order #{orderResult.orderId}
              </p>
              <p className="kiosk__confirmation-total">
                Total charged: <strong>${orderResult.total}</strong>
              </p>
              <p className="kiosk__confirmation-msg">
                Thank you for your order! 🐉
              </p>
              <div className="kiosk__confirmation-progress" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
