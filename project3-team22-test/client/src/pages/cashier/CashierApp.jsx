import { useState, useEffect, useCallback } from 'react'
import './Cashier.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'


const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%']
const ICE_LEVELS = ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice']
const TOPPINGS = [
  { label: 'None', price: 0 },
  { label: 'Boba (+$0.50)', price: 0.50 },
  { label: 'Lychee Jelly (+$0.50)', price: 0.50 },
  { label: 'Pudding (+$0.50)', price: 0.50 },
]

export default function CashierApp() {
  const [employee, setEmployee] = useState(null)
  const [loginId, setLoginId] = useState('')
  const [loginError, setLoginError] = useState('')

  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])

  // center panel state
  const [centerView, setCenterView] = useState('categories') // categories | items | customize
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [sugar, setSugar] = useState('100%')
  const [ice, setIce] = useState('Regular Ice')
  const [topping, setTopping] = useState('None')

  // cart / order state
  const [cart, setCart] = useState([])
  const [orderLog, setOrderLog] = useState('')
  const [cartTotal, setCartTotal] = useState(0)

  // fetch menu once logged in
  useEffect(() => {
    if (!employee) return
    fetch(`${API}/menu`)
      .then(r => r.json())
      .then(data => {
        setMenu(data)
        const cats = [...new Set(data.filter(i => i.category !== 'Add-on').map(i => i.category))]
        if (!cats.includes('Seasonal')) cats.push('Seasonal')
        setCategories(cats)
      })
  }, [employee])

  // --- AUTH ---
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: loginId }),
    })
    const data = await res.json()
    if (!res.ok) { setLoginError(data.error || 'Login failed'); return }
    if (data.role.toLowerCase() === 'manager') {
      setLoginError('Managers must use the Manager view.')
      return
    }
    setEmployee(data)
  }

  const handleLogout = () => {
    setEmployee(null)
    setLoginId('')
    setCart([])
    setOrderLog('')
    setCartTotal(0)
    setCenterView('categories')
  }

  // --- CART ---
  const itemTotal = useCallback(() => {
    if (!selectedItem) return 0
    const top = TOPPINGS.find(t => t.label === topping)
    return selectedItem.price + (top?.price || 0)
  }, [selectedItem, topping])

  const addToCart = () => {
    const top = TOPPINGS.find(t => t.label === topping)
    const finalPrice = selectedItem.price + (top?.price || 0)
    const newItem = {
      id: Date.now(),
      menuItemId: selectedItem.menu_item_id,
      name: selectedItem.item_name,
      basePrice: selectedItem.price,
      finalPrice,
      sugar,
      ice,
      topping,
    }
    setCart(prev => [...prev, newItem])
    setCartTotal(prev => prev + finalPrice)
    setOrderLog(prev =>
      prev + `${selectedItem.item_name} - $${finalPrice.toFixed(2)}\n  - ${sugar} Sugar\n  - ${ice}\n  - ${topping}\n\n`
    )
    setCenterView('categories')
    setSugar('100%'); setIce('Regular Ice'); setTopping('None')
  }

  const clearCart = () => {
    setCart([]); setCartTotal(0); setOrderLog(''); setCenterView('categories')
  }

  const handleCheckout = async () => {
    if (cart.length === 0) { alert('Cart is empty! Add items first.'); return }
    const method = window.prompt('Payment method:\n1. Cash\n2. Credit\n3. Debit\n\nType Cash, Credit, or Debit:') || 'Cash'
    const valid = ['Cash', 'Credit', 'Debit']
    const paymentMethod = valid.find(v => v.toLowerCase() === method.toLowerCase()) || 'Cash'

    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({
          menuItemId: i.menuItemId, finalPrice: i.finalPrice, basePrice: i.basePrice,
          sugarLevel: i.sugar, iceLevel: i.ice, topping: i.topping,
        })),
        paymentMethod,
        employeeId: employee.employeeId,
      }),
    })
    const data = await res.json()
    if (data.success) { alert('Order placed successfully!'); clearCart() }
    else alert('Error placing order. Check database connection.')
  }

  const categoryItems = menu.filter(i => i.category === selectedCategory)

  // ========== LOGIN SCREEN ==========
  if (!employee) {
    return (
      <div className="cashier-login">
        <h1 className="cashier-login__title">DRAGON BOBA</h1>
        <form className="cashier-login__form" onSubmit={handleLogin}>
          <label>Employee ID:</label>
          <input
            type="text"
            value={loginId}
            onChange={e => setLoginId(e.target.value)}
            autoFocus
          />
          {loginError && <p className="cashier-login__error">{loginError}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    )
  }

  // ========== CASHIER MAIN SCREEN ==========
  return (
    <div className="cashier">
      {/* CENTER PANEL */}
      <div className="cashier__center">

        {/* CATEGORIES */}
        {centerView === 'categories' && (
          <div className="cashier__category-grid">
            {categories.map(cat => (
              <button
                key={cat}
                className="cashier__cat-btn"
                onClick={() => { setSelectedCategory(cat); setCenterView('items') }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* ITEMS */}
        {centerView === 'items' && (
          <div className="cashier__items-container">
            <div className="cashier__items-grid">
              <button
                className="cashier__item-btn cashier__item-btn--back"
                onClick={() => setCenterView('categories')}
              >
                &lt;- Back
              </button>
              {categoryItems.map(item => (
                <button
                  key={item.menu_item_id}
                  className="cashier__item-btn"
                  onClick={() => {
                    setSelectedItem(item)
                    setSugar('100%'); setIce('Regular Ice'); setTopping('None')
                    setCenterView('customize')
                  }}
                >
                  <span className="cashier__item-name">{item.item_name}</span>
                  <span className="cashier__item-price">${item.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOMIZE */}
        {centerView === 'customize' && selectedItem && (
          <div className="cashier__customize">
            <h2 className="cashier__customize-title">Customize Drink</h2>

            <div className="cashier__customize-row">
              <label>Sugar Level:</label>
              <select value={sugar} onChange={e => setSugar(e.target.value)}>
                {SUGAR_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <div className="cashier__customize-row">
              <label>Ice Level:</label>
              <select value={ice} onChange={e => setIce(e.target.value)}>
                {ICE_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <div className="cashier__customize-row">
              <label>Topping:</label>
              <select value={topping} onChange={e => setTopping(e.target.value)}>
                {TOPPINGS.map(t => <option key={t.label}>{t.label}</option>)}
              </select>
            </div>

            <div className="cashier__item-total">
              Item Total: ${itemTotal().toFixed(2)}
            </div>

            <div className="cashier__customize-actions">
              <button onClick={() => setCenterView('items')}>Go Back</button>
              <button className="cashier__add-btn" onClick={addToCart}>Add to Cart</button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR — ORDER SUMMARY */}
      <div className="cashier__sidebar">
        <div className="cashier__sidebar-title">Current Order</div>
        <textarea
          className="cashier__order-log"
          readOnly
          value={orderLog}
        />
        <div className="cashier__sidebar-footer">
          <div className="cashier__total">Total: ${cartTotal.toFixed(2)}</div>
          <div className="cashier__sidebar-btns">
            <button className="cashier__checkout-btn" onClick={handleCheckout}>Check-Out</button>
            <button className="cashier__logout-btn" onClick={handleLogout}>Log Out</button>
          </div>
        </div>
      </div>
    </div>
  )
}
