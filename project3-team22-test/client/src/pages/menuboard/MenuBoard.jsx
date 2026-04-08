import { useState, useEffect } from 'react'
import './MenuBoard.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

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

function getDrinkImage(itemName) {
  const slug = itemName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return `/drinks/${slug}.png`
}

export default function MenuBoard() {
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/menu`)
      .then(r => r.json())
      .then(data => {
        const filteredMenu = data.filter(item => item.category !== 'Add-on')
        setMenu(filteredMenu)
        
        const cats = [...new Set(filteredMenu.map(i => i.category))]
        if (!cats.includes('Seasonal') && filteredMenu.some(i => i.category === 'Seasonal')) {
          cats.push('Seasonal')
        }
        setCategories(cats)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load menu board:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="menuboard">
        <div className="menuboard__loading">Refreshing Menu...</div>
      </div>
    )
  }

  // Build the content payload (categories + items)
  const renderCategories = () => (
    categories.map(cat => {
      const items = menu.filter(item => item.category === cat)
      if (items.length === 0) return null

      return (
        <div key={cat} className="menuboard__category">
          <h2 className="menuboard__category-header">
            <span>{getCategoryIcon(cat)}</span> {cat}
          </h2>
          <div className="menuboard__grid">
            {items.map(item => (
              <div key={item.menu_item_id} className="menuboard__item">
                <div className="menuboard__item-image-wrap">
                  <img
                    className="menuboard__item-image"
                    src={getDrinkImage(item.item_name)}
                    alt={item.item_name}
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div className="menuboard__item-image-fallback" style={{ display: 'none' }}>
                    {getCategoryIcon(item.category)}
                  </div>
                </div>
                <div className="menuboard__item-info">
                  <div className="menuboard__item-name">{item.item_name}</div>
                  <div className="menuboard__item-price">${item.price.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    })
  )

  return (
    <div className="menuboard">
      <header className="menuboard__header">
        <span className="menuboard__logo-icon">🐉</span>
        <h1 className="menuboard__title">Dragon Boba Menu</h1>
      </header>
      
      <div className="menuboard__viewport">
        {/* We render two identical blocks so the CSS animation can scroll seamlessly 
            from block 1 to block 2 indefinitely (-50% transform). */}
        <div className="menuboard__scroll-container">
          <div className="menuboard__content-block">
            {renderCategories()}
          </div>
          <div className="menuboard__content-block" aria-hidden="true">
            {renderCategories()}
          </div>
        </div>
      </div>
    </div>
  )
}
