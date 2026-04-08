import { useState, useEffect } from 'react'
import './MenuBoard.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Omit "Add-on". You can omit others if they shouldn't be publicly listed on TV
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

  const renderCategoryList = () => (
    <div className="menuboard__categories-masonry">
      {categories.map(cat => {
        const items = menu.filter(item => item.category === cat)
        if (items.length === 0) return null

        return (
          <div key={cat} className="menuboard__category">
            <h2 className="menuboard__category-header">
              <span>{getCategoryIcon(cat)}</span> {cat}
            </h2>
            <div className="menuboard__items-list">
              {items.map(item => (
                <div key={item.menu_item_id} className="menuboard__item-row">
                  <span className="menuboard__item-name">{item.item_name}</span>
                  <div className="menuboard__item-dots"></div>
                  <span className="menuboard__item-price">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="menuboard">
      <header className="menuboard__header">
        <span className="menuboard__logo-icon">🐉</span>
        <h1 className="menuboard__title">Dragon Boba Menu</h1>
      </header>
      
      <div className="menuboard__content-grid">
        {/* Dynamic masonry columns automatically balance varying length lists */}
        {renderCategoryList()}

        {/* Column 3 - Hero Poster Display */}
        <div className="menuboard__hero">
          <img 
            className="menuboard__hero-image" 
            /* Hardcode one of the best looking images provided by the user */
            src="/drinks/classic-milk-tea.png" 
            alt="Classic Milk Tea"
          />
          <div className="menuboard__hero-badge">
            <small>CUSTOMER FAVORITE</small>
            <span>$5.50</span>
          </div>
        </div>
      </div>
    </div>
  )
}
