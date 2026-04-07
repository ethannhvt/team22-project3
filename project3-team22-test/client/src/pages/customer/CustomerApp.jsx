import { useState, useEffect, useCallback, useRef } from 'react'
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

// Convert item name to image filename slug
// e.g. "Brown Sugar Milk Tea" → "/drinks/brown-sugar-milk-tea.jpg"
function getDrinkImage(itemName) {
  const slug = itemName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .trim()
    .replace(/\s+/g, '-')            // spaces to hyphens
  return `/drinks/${slug}.jpg`
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

const FONT_SIZES = ['normal', 'large', 'xlarge']
const FONT_SIZE_LABELS = { normal: 'A', large: 'A+', xlarge: 'A++' }

// Supported languages
const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
]

// All static UI strings that need translation
const UI_STRINGS = {
  moodTitle: 'What are you in the mood for?',
  backToMenu: 'Back to Menu',
  backTo: 'Back to',
  sugarLevel: 'Sugar Level',
  iceLevel: 'Ice Level',
  addTopping: 'Add a Topping',
  addToCart: 'Add to Cart',
  startingAt: 'Starting at',
  yourOrder: 'Your Order',
  cartEmpty: 'Your cart is empty',
  browseMenu: 'Browse Menu',
  continueShopping: 'Continue Shopping',
  subtotal: 'Subtotal',
  tax: 'Tax (8.25%)',
  total: 'Total',
  proceedCheckout: 'Proceed to Checkout',
  howToPay: 'How would you like to pay?',
  cash: 'Cash',
  payAtCounter: 'Pay at counter',
  credit: 'Credit',
  creditCard: 'Credit card',
  debit: 'Debit',
  debitCard: 'Debit card',
  placingOrder: 'Placing your order...',
  orderPlaced: 'Order Placed!',
  totalCharged: 'Total charged:',
  thankYou: 'Thank you for your order! 🐉',
  loadingMenu: 'Loading menu...',
  backToCart: 'Back to Cart',
  sugar: 'Sugar',
  noItems: 'No items available in this category yet.',
  noIce: 'No Ice',
  lessIce: 'Less Ice',
  regularIce: 'Regular Ice',
  extraIce: 'Extra Ice',
  none: 'None',
  boba: 'Boba',
  lycheeJelly: 'Lychee Jelly',
  pudding: 'Pudding',
}

export default function CustomerApp() {
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Accessibility state
  const [fontSize, setFontSize] = useState('normal')

  // Translation state
  const [lang, setLang] = useState('en')
  const [translations, setTranslations] = useState({})   // { langCode: { englishText: translatedText } }
  const [translating, setTranslating] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const langDropdownRef = useRef(null)

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

  // Email notification state
  const [notifyEmail, setNotifyEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  const cycleFontSize = useCallback(() => {
    setFontSize(prev => {
      const idx = FONT_SIZES.indexOf(prev)
      return FONT_SIZES[(idx + 1) % FONT_SIZES.length]
    })
  }, [])

  // ── Translation Logic ──
  // Translate a batch of texts via our server proxy
  const translateTexts = useCallback(async (texts, targetLang) => {
    if (targetLang === 'en') return null
    try {
      const response = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, targetLang }),
      })
      const data = await response.json()
      if (data.translations) {
        const map = {}
        texts.forEach((text, i) => {
          map[text] = data.translations[i]
        })
        return map
      }
    } catch (err) {
      console.error('Translation error:', err)
    }
    return null
  }, [])

  // When language changes, translate all UI strings + menu items
  useEffect(() => {
    if (lang === 'en') return
    if (translations[lang]) return  // already cached

    const allTexts = [
      ...Object.values(UI_STRINGS),
      ...menu.map(item => item.item_name),
      ...categories,
    ]
    // Deduplicate
    const uniqueTexts = [...new Set(allTexts)]

    setTranslating(true)
    translateTexts(uniqueTexts, lang).then(map => {
      if (map) {
        setTranslations(prev => ({ ...prev, [lang]: map }))
      }
      setTranslating(false)
    })
  }, [lang, menu, categories, translations, translateTexts])

  // Translation helper — returns translated text or original if no translation
  const t = useCallback((text) => {
    if (lang === 'en' || !translations[lang]) return text
    return translations[lang][text] || text
  }, [lang, translations])

  // Close language dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const sendEmailNotification = useCallback(async () => {
    if (!notifyEmail.trim()) return
    setEmailSending(true)
    try {
      const res = await fetch(`${API_BASE}/email/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail.trim(),
          orderId: orderResult?.orderId,
          total: orderResult?.total,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEmailSent(true)
      } else {
        alert('Could not schedule email. Please try again.')
      }
    } catch (err) {
      console.error('Email notify error:', err)
      alert('Connection error scheduling email.')
    } finally {
      setEmailSending(false)
    }
  }, [notifyEmail, orderResult])

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
        setNotifyEmail('')
        setEmailSent(false)
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

  // Current language info
  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  if (loading) {
    return (
      <div className="kiosk">
        <div className="kiosk__loading">
          <div className="kiosk__loading-spinner" />
          <p>{t(UI_STRINGS.loadingMenu)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`kiosk ${fontSize !== 'normal' ? `kiosk--font-${fontSize}` : ''}`}>
      {/* Header */}
      <header className="kiosk__header">
        <div className="kiosk__header-brand">
          <span className="kiosk__header-icon">🐉</span>
          <h1 className="kiosk__header-title">Dragon Boba</h1>
        </div>
        <div className="kiosk__header-actions">
          {/* Language Picker */}
          <div className="kiosk__lang-picker" ref={langDropdownRef}>
            <button
              className={`kiosk__lang-btn ${lang !== 'en' ? 'kiosk__lang-btn--active' : ''}`}
              onClick={() => setLangDropdownOpen(prev => !prev)}
              title="Change language"
            >
              <span className="kiosk__lang-flag">{currentLang.flag}</span>
              <span className="kiosk__lang-code">{currentLang.code.toUpperCase()}</span>
              <span className="kiosk__lang-arrow">{langDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {langDropdownOpen && (
              <div className="kiosk__lang-dropdown">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    className={`kiosk__lang-option ${lang === l.code ? 'kiosk__lang-option--active' : ''}`}
                    onClick={() => {
                      setLang(l.code)
                      setLangDropdownOpen(false)
                    }}
                  >
                    <span className="kiosk__lang-option-flag">{l.flag}</span>
                    <span className="kiosk__lang-option-label">{l.label}</span>
                    {lang === l.code && <span className="kiosk__lang-option-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size Toggle */}
          <button
            className={`kiosk__font-toggle ${fontSize !== 'normal' ? 'kiosk__font-toggle--active' : ''}`}
            onClick={cycleFontSize}
            title={`Text size: ${fontSize === 'normal' ? 'Normal' : fontSize === 'large' ? 'Large' : 'Extra Large'}`}
          >
            <span className="kiosk__font-toggle-icon">🔤</span>
            <span className="kiosk__font-toggle-label">{FONT_SIZE_LABELS[fontSize]}</span>
          </button>
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
        </div>
      </header>

      {/* Translating indicator */}
      {translating && (
        <div className="kiosk__translating-bar">
          <div className="kiosk__loading-spinner kiosk__loading-spinner--small" />
          <span>Translating...</span>
        </div>
      )}

      {/* Main Content */}
      <main className="kiosk__main">
        {/* ===== CATEGORIES VIEW ===== */}
        {view === 'categories' && (
          <div className="kiosk__categories fade-in">
            <h2 className="kiosk__section-title">{t(UI_STRINGS.moodTitle)}</h2>
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
                  <span className="kiosk__category-name">{t(cat)}</span>
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
              ← {t(UI_STRINGS.backToMenu)}
            </button>
            <h2 className="kiosk__section-title">{getCategoryIcon(selectedCategory)} {t(selectedCategory)}</h2>
            <div className="kiosk__items-grid">
              {categoryItems.length === 0 ? (
                <p className="kiosk__empty-msg">{t(UI_STRINGS.noItems)}</p>
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
                    <div className="kiosk__item-image-wrap">
                      <img
                        className="kiosk__item-image"
                        src={getDrinkImage(item.item_name)}
                        alt={item.item_name}
                        onError={e => {
                          // If image file doesn't exist, swap to emoji fallback
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextSibling.style.display = 'flex'
                        }}
                      />
                      <div className="kiosk__item-image-fallback">
                        <span>{getCategoryIcon(item.category)}</span>
                      </div>
                    </div>
                    <div className="kiosk__item-info">
                      <span className="kiosk__item-name">{t(item.item_name)}</span>
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
              ← {t(UI_STRINGS.backTo)} {t(selectedCategory)}
            </button>

            <div className="kiosk__customize-layout">
              <div className="kiosk__customize-header">
                <div className="kiosk__customize-item-icon">
                  {getCategoryIcon(selectedItem.category)}
                </div>
                <div>
                  <h2 className="kiosk__customize-title">{t(selectedItem.item_name)}</h2>
                  <p className="kiosk__customize-base-price">{t(UI_STRINGS.startingAt)} ${selectedItem.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Sugar Level */}
              <div className="kiosk__option-group">
                <h3 className="kiosk__option-label">{t(UI_STRINGS.sugarLevel)}</h3>
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
                <h3 className="kiosk__option-label">{t(UI_STRINGS.iceLevel)}</h3>
                <div className="kiosk__option-row">
                  {ICE_LEVELS.map(level => (
                    <button
                      key={level}
                      className={`kiosk__option-btn kiosk__option-btn--ice ${ice === level ? 'kiosk__option-btn--active' : ''}`}
                      onClick={() => setIce(level)}
                    >
                      <span className="kiosk__option-icon">{ICE_ICONS[level]}</span>
                      <span>{t(level)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toppings */}
              <div className="kiosk__option-group">
                <h3 className="kiosk__option-label">{t(UI_STRINGS.addTopping)}</h3>
                <div className="kiosk__option-row">
                  {TOPPINGS.map(top => (
                    <button
                      key={top.name}
                      className={`kiosk__option-btn kiosk__option-btn--topping ${topping === top.name ? 'kiosk__option-btn--active' : ''}`}
                      onClick={() => setTopping(top.name)}
                    >
                      <span>{t(top.name)}</span>
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
                {t(UI_STRINGS.addToCart)}
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
              ← {t(UI_STRINGS.continueShopping)}
            </button>
            <h2 className="kiosk__section-title">{t(UI_STRINGS.yourOrder)}</h2>

            {cart.length === 0 ? (
              <div className="kiosk__cart-empty">
                <span className="kiosk__cart-empty-icon">🧋</span>
                <p>{t(UI_STRINGS.cartEmpty)}</p>
                <button
                  className="kiosk__browse-btn"
                  onClick={() => setView('categories')}
                >
                  {t(UI_STRINGS.browseMenu)}
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
                        <h3 className="kiosk__cart-item-name">{t(item.name)}</h3>
                        <div className="kiosk__cart-item-details">
                          <span>{item.sugarLevel} {t(UI_STRINGS.sugar)}</span>
                          <span>•</span>
                          <span>{t(item.iceLevel)}</span>
                          {item.topping !== 'None' && (
                            <>
                              <span>•</span>
                              <span>{t(item.topping)}</span>
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
                    <span>{t(UI_STRINGS.subtotal)}</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="kiosk__cart-line">
                    <span>{t(UI_STRINGS.tax)}</span>
                    <span>${cartTax.toFixed(2)}</span>
                  </div>
                  <div className="kiosk__cart-line kiosk__cart-line--total">
                    <span>{t(UI_STRINGS.total)}</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    className="kiosk__checkout-btn"
                    onClick={() => setView('checkout')}
                  >
                    {t(UI_STRINGS.proceedCheckout)}
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
              ← {t(UI_STRINGS.backToCart)}
            </button>
            <h2 className="kiosk__section-title">{t(UI_STRINGS.howToPay)}</h2>
            <p className="kiosk__checkout-total-display">
              {t(UI_STRINGS.total)}: <strong>${cartTotal.toFixed(2)}</strong>
            </p>

            <div className="kiosk__payment-grid">
              {[
                { method: UI_STRINGS.cash, icon: '💵', desc: UI_STRINGS.payAtCounter },
                { method: UI_STRINGS.credit, icon: '💳', desc: UI_STRINGS.creditCard },
                { method: UI_STRINGS.debit, icon: '🏧', desc: UI_STRINGS.debitCard },
              ].map(p => (
                <button
                  key={p.method}
                  className="kiosk__payment-card"
                  disabled={submitting}
                  onClick={() => submitOrder(p.method)}
                >
                  <span className="kiosk__payment-icon">{p.icon}</span>
                  <span className="kiosk__payment-method">{t(p.method)}</span>
                  <span className="kiosk__payment-desc">{t(p.desc)}</span>
                </button>
              ))}
            </div>
            {submitting && (
              <div className="kiosk__submitting">
                <div className="kiosk__loading-spinner" />
                <p>{t(UI_STRINGS.placingOrder)}</p>
              </div>
            )}
          </div>
        )}

        {/* ===== CONFIRMATION VIEW ===== */}
        {view === 'confirmation' && orderResult && (
          <div className="kiosk__confirmation fade-in">
            <div className="kiosk__confirmation-card">
              <div className="kiosk__confirmation-check">✓</div>
              <h2 className="kiosk__confirmation-title">{t(UI_STRINGS.orderPlaced)}</h2>
              <p className="kiosk__confirmation-order-id">
                Order #{orderResult.orderId}
              </p>
              <p className="kiosk__confirmation-total">
                {t(UI_STRINGS.totalCharged)} <strong>${orderResult.total}</strong>
              </p>
              <p className="kiosk__confirmation-msg">
                {t(UI_STRINGS.thankYou)}
              </p>

              {/* Email Notification */}
              <div className="kiosk__sms-section">
                {emailSent ? (
                  <div className="kiosk__sms-success">
                    <span className="kiosk__sms-success-icon">📧</span>
                    <p>We'll email you when your order is ready!</p>
                  </div>
                ) : (
                  <>
                    <p className="kiosk__sms-label">📧 Want an email when your order is ready?</p>
                    <div className="kiosk__sms-input-row">
                      <input
                        className="kiosk__sms-input"
                        type="email"
                        placeholder="Enter your email address"
                        value={notifyEmail}
                        onChange={e => setNotifyEmail(e.target.value)}
                      />
                      <button
                        className="kiosk__sms-btn"
                        onClick={sendEmailNotification}
                        disabled={emailSending || !notifyEmail.trim()}
                      >
                        {emailSending ? '...' : 'Notify Me'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="kiosk__confirmation-progress" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
