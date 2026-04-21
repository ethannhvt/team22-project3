import { useState, useEffect } from 'react'
import './Manager.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'


// ─── Reusable table component ───
function DataTable({ columns, rows, selectedRow, onSelect }) {
  return (
    <div className="mgr-table-wrap">
      <table className="mgr-table">
        <thead>
          <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={selectedRow === i ? 'mgr-table__row--selected' : ''}
              onClick={() => onSelect && onSelect(i)}
            >
              {row.map((cell, j) => <td key={j}>{cell ?? ''}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Menu Management Panel ───
function MenuPanel() {
  const [items, setItems] = useState([])
  const [sel, setSel] = useState(null)
  
  // Update state (only price is updated)
  const [updatePriceValue, setUpdatePriceValue] = useState('')

  // Modal / Add New Item state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState(''), [cat, setCat] = useState(''), [price, setPrice] = useState('')
  
  // Ingredients state
  const [inventory, setInventory] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [ingSelection, setIngSelection] = useState('new')
  const [ingName, setIngName] = useState('')
  const [ingAmount, setIngAmount] = useState('')
  const [ingUnit, setIngUnit] = useState('')

  const load = () => {
    fetch(`${API}/menu`).then(r => r.json()).then(data => setItems(data))
    fetch(`${API}/inventory`).then(r => r.json()).then(setInventory)
  }
  useEffect(() => { load() }, [])

  const handleAddIngredient = () => {
    if (!ingAmount || !ingUnit) {
      alert("Amount and Unit are required for the ingredient."); return;
    }
    let newIng = {};
    if (ingSelection === 'new') {
      if (!ingName) { alert("Ingredient name is required."); return; }
      newIng = { isNew: true, name: ingName, amount: parseFloat(ingAmount), unit: ingUnit };
    } else {
      const invItem = inventory.find(i => i.inventory_item_id === parseInt(ingSelection));
      if (!invItem) return;
      newIng = { isNew: false, inventoryId: invItem.inventory_item_id, name: invItem.item_name, amount: parseFloat(ingAmount), unit: ingUnit };
    }
    setIngredients([...ingredients, newIng]);
    setIngName(''); setIngAmount(''); setIngUnit(''); setIngSelection('new');
  }

  const removeIngredient = (idx) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  }

  const addItem = async () => {
    if (!name || !cat || !price) { alert('Name, Category and Price are required.'); return }
    await fetch(`${API}/menu`, { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, category: cat, price: parseFloat(price), ingredients }) })
    setName(''); setCat(''); setPrice(''); setIngredients([]); setSel(null); setIsModalOpen(false); load();
    alert(`'${name}' added to Menu!`)
  }
  const updatePrice = async () => {
    if (sel === null) { alert("Please select an item to update."); return; }
    if (!updatePriceValue) { alert("Please enter a new price."); return; }
    const id = items[sel].menu_item_id
    await fetch(`${API}/menu/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ price: parseFloat(updatePriceValue) }) })
    setUpdatePriceValue(''); load()
  }
  const removeItem = async () => {
    if (sel === null) return
    const id = items[sel].menu_item_id
    await fetch(`${API}/menu/${id}`, { method:'DELETE' })
    setSel(null); load()
  }

  return (
    <div className="mgr-panel">
      <DataTable
        columns={['ID','Name','Category','Price']}
        rows={items.map(i => [i.menu_item_id, i.item_name, i.category, `$${parseFloat(i.price).toFixed(2)}`])}
        selectedRow={sel} onSelect={setSel}
      />
      
      {/* Base UI Bottom Row */}
      <div className="mgr-form mgr-form-base">
        <label>Update Price: $</label>
        <input 
          type="number" 
          min="0" 
          step="0.01" 
          value={updatePriceValue} 
          onChange={e=>setUpdatePriceValue(e.target.value)} 
          style={{width:70}} 
          placeholder="New $"
        />
        <button onClick={updatePrice} className="mgr-btn--alt">Update Selected Price</button>
        <button className="mgr-btn--red" onClick={removeItem}>Remove Selected Item</button>
        
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setIsModalOpen(true)} className="mgr-btn-primary">
            + Add New Item
          </button>
        </div>
      </div>

      {/* Pop-up Modal */}
      {isModalOpen && (
        <div className="mgr-modal-overlay">
          <div className="mgr-modal-content">
            <button className="mgr-modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            
            <h2 style={{marginTop: 0, marginBottom: '20px'}}>Create New Drink</h2>
            
            <div className="mgr-form-section">
              <h3>Drink Details</h3>
              <div className="mgr-form-row">
                <label>Name:</label><input value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div className="mgr-form-row">
                <label>Category:</label><input value={cat} onChange={e=>setCat(e.target.value)} />
              </div>
              <div className="mgr-form-row">
                <label>Price: $</label><input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} style={{width:80}} />
              </div>
            </div>
            
            <div className="mgr-form-section mgr-ingredients-builder" style={{ marginTop: '20px' }}>
              <h3>Recipe Builder</h3>
              <div className="mgr-form-row">
                <select value={ingSelection} onChange={e=>setIngSelection(e.target.value)} style={{ flex: 1 }}>
                  <option value="new">-- Create New Ingredient --</option>
                  {inventory.map(i => <option key={i.inventory_item_id} value={i.inventory_item_id}>{i.item_name}</option>)}
                </select>
              </div>
              {ingSelection === 'new' && (
                <div className="mgr-form-row">
                  <label>Name:</label><input value={ingName} onChange={e=>setIngName(e.target.value)} placeholder="e.g. Matcha Powder" />
                </div>
              )}
              <div className="mgr-form-row mgr-form-row-compact">
                <label>Amount:</label><input type="number" min="0" step="0.1" value={ingAmount} onChange={e=>setIngAmount(e.target.value)} style={{width:60}} />
                <label>Unit:</label><input value={ingUnit} onChange={e=>setIngUnit(e.target.value)} style={{width:60}} placeholder="g" />
                <button type="button" onClick={handleAddIngredient} className="mgr-btn-small">Add</button>
              </div>
              
              {ingredients.length > 0 && (
                <div className="mgr-ingredients-list">
                  <h4>Included Ingredients:</h4>
                  <ul>
                    {ingredients.map((ing, idx) => (
                      <li key={idx}>
                        <span className="ing-info">{ing.amount} {ing.unit} {ing.name} {ing.isNew && <span className="mgr-badge">NEW</span>}</span>
                        <button className="mgr-btn-tiny mgr-btn--red" onClick={() => removeIngredient(idx)}>✕</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ marginTop: '30px', textAlign: 'right' }}>
              <button onClick={addItem} className="mgr-btn-primary" style={{ padding: '10px 20px', fontSize: '1.05rem' }}>
                Save & Add Drink
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inventory Panel ───
function InventoryPanel() {
  const [items, setItems] = useState([])
  const [sel, setSel] = useState(null)
  const [nameV, setNameV] = useState(''), [qty, setQty] = useState(''), [min, setMin] = useState('')
  const [unit, setUnit] = useState(''), [supId, setSupId] = useState('')

  const load = () => fetch(`${API}/inventory`).then(r=>r.json()).then(setItems)
  useEffect(() => { load() }, [])

  const addItem = async () => {
    if (parseFloat(qty) < 0 || parseFloat(min) < 0) {
      alert("Quantities cannot be negative."); return;
    }
    await fetch(`${API}/inventory`, { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: nameV, qty: parseFloat(qty), min: parseFloat(min), unit, supplierId: parseInt(supId)||null }) })
    setNameV(''); setQty(''); setMin(''); setUnit(''); setSupId(''); load()
  }
  const updateQty = async () => {
    if (sel === null) return
    if (qty === '' || parseFloat(qty) < 0) {
      alert("Quantity must be a positive number."); return;
    }
    const id = items[sel].inventory_item_id
    await fetch(`${API}/inventory/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ qty: parseFloat(qty) }) })
    setQty(''); load()
    alert("Quantity successfully updated/restocked!")
  }
  const removeItem = async () => {
    if (sel === null) return
    const id = items[sel].inventory_item_id
    await fetch(`${API}/inventory/${id}`, { method:'DELETE' })
    setSel(null); load()
  }

  const lowStockItems = items.filter(i => parseFloat(i.current_quantity) <= parseFloat(i.minimum_amount));

  return (
    <div className="mgr-panel">
      {lowStockItems.length > 0 && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '4px', marginBottom: '16px', borderLeft: '4px solid #c62828' }}>
          <strong>⚠️ Low Stock Alert:</strong> {lowStockItems.length} item(s) need restocking: {lowStockItems.map(i => i.item_name).join(', ')}
        </div>
      )}
      <DataTable
        columns={['ID','Item Name','Quantity','Min Amount','Unit','Last Updated','Supplier ID']}
        rows={items.map(i=>[i.inventory_item_id, i.item_name, i.current_quantity, i.minimum_amount, i.unit,
          i.last_updated ? new Date(i.last_updated).toLocaleDateString() : '', i.supplier_id])}
        selectedRow={sel} onSelect={setSel}
      />
      <div className="mgr-form">
        <label>Name:</label><input value={nameV} onChange={e=>setNameV(e.target.value)} style={{width:90}} />
        <label>Qty:</label><input type="number" min="0" value={qty} onChange={e=>setQty(e.target.value)} style={{width:60}} />
        <label>Min:</label><input type="number" min="0" value={min} onChange={e=>setMin(e.target.value)} style={{width:60}} />
        <label>Unit:</label><input value={unit} onChange={e=>setUnit(e.target.value)} style={{width:60}} />
        <label>Sup ID:</label><input value={supId} onChange={e=>setSupId(e.target.value)} style={{width:50}} />
        <button onClick={updateQty}>Update Selected Qty</button>
        <button onClick={addItem}>Add New</button>
        <button className="mgr-btn--red" onClick={removeItem}>Remove Selected</button>
      </div>
    </div>
  )
}

// ─── Employee Panel ───
function EmployeePanel() {
  const [emps, setEmps] = useState([])
  const [sel, setSel] = useState(null)
  const [nameV, setNameV] = useState(''), [role, setRole] = useState('Cashier')
  const [email, setEmail] = useState(''), [status, setStatus] = useState('Active')

  const load = () => fetch(`${API}/employees`).then(r=>r.json()).then(setEmps)
  useEffect(() => { load() }, [])

  const addEmp = async () => {
    await fetch(`${API}/employees`, { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: nameV, role, email, status }) })
    setNameV(''); setEmail(''); load()
  }
  const removeEmp = async () => {
    if (sel === null) return
    const id = emps[sel].employee_id
    await fetch(`${API}/employees/${id}`, { method:'DELETE' })
    setSel(null); load()
  }

  return (
    <div className="mgr-panel">
      <DataTable
        columns={['Employee ID','Name','Role','Email','Status']}
        rows={emps.map(e=>[e.employee_id, e.name, e.role, e.username_email, e.status])}
        selectedRow={sel} onSelect={setSel}
      />
      <div className="mgr-form">
        <label>Name:</label><input value={nameV} onChange={e=>setNameV(e.target.value)} style={{width:100}} />
        <label>Role:</label>
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option>Cashier</option><option>Manager</option>
        </select>
        <label>Email:</label><input value={email} onChange={e=>setEmail(e.target.value)} style={{width:120}} />
        <label>Status:</label>
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option>Active</option><option>Inactive</option>
        </select>
        <button onClick={addEmp}>Add Employee</button>
        <button className="mgr-btn--red" onClick={removeEmp}>Remove Employee</button>
      </div>
    </div>
  )
}

// ─── Reports Panel ───
function ReportsPanel() {
  const [reports, setReports] = useState([])
  const [message, setMessage] = useState('')

  const load = () => fetch(`${API}/reports`).then(r=>r.json()).then(setReports)
  useEffect(() => { load() }, [])

  const addReport = async () => {
    await fetch(`${API}/reports`, { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message }) })
    setMessage(''); load()
  }

  return (
    <div className="mgr-panel">
      <DataTable
        columns={['ID','Date','Message']}
        rows={reports.map(r=>[r.report_id, r.report_date, r.message])}
      />
      <div className="mgr-form mgr-form--stacked">
        <textarea
          className="mgr-report-textarea"
          value={message}
          onChange={e=>setMessage(e.target.value)}
          placeholder="Enter daily report message..."
          rows={4}
        />
        <button onClick={addReport}>Add Daily Report</button>
      </div>
    </div>
  )
}

// ─── Analytics Panel ───
function AnalyticsPanel() {
  const [tab, setTab] = useState('xreport')
  const [xData, setXData] = useState(null)
  const [zData, setZData] = useState(null)
  const [salesData, setSalesData] = useState(null)
  const [usageData, setUsageData] = useState(null)
  const [salesStart, setSalesStart] = useState(''), [salesEnd, setSalesEnd] = useState('')
  const [usageStart, setUsageStart] = useState(''), [usageEnd, setUsageEnd] = useState('')
  const [recentOrders, setRecentOrders] = useState([])

  const runXReport = () => fetch(`${API}/analytics/x-report`).then(r=>r.json()).then(setXData)
  const runZReport = async () => {
    if (!window.confirm('Are you sure? This will zero out the X-Report for the rest of the day.')) return
    const data = await fetch(`${API}/analytics/z-report`, { method:'POST' }).then(r=>r.json())
    if (data.alreadyRun) alert('A Z-Report has already been processed today.')
    else { alert('Z-Report generated and daily values reset.'); setZData(data) }
  }
  const runSales = () => {
    if (!salesStart||!salesEnd) { alert('Please select both start and end dates.'); return }
    fetch(`${API}/analytics/sales?start=${salesStart}&end=${salesEnd}`).then(r=>r.json()).then(setSalesData)
  }
  const runUsage = () => {
    if (!usageStart||!usageEnd) { alert('Please select both start and end dates.'); return }
    fetch(`${API}/analytics/product-usage?start=${usageStart}&end=${usageEnd}`).then(r=>r.json()).then(setUsageData)
  }
  const loadRecent = () => fetch(`${API}/analytics/recent-orders`).then(r=>r.json()).then(setRecentOrders)
  useEffect(() => { loadRecent() }, [])

  return (
    <div className="mgr-panel mgr-analytics">
      <div className="mgr-analytics-tabs">
        {[['xreport','X-Report'],['zreport','Z-Report'],['sales','Sales Report'],['usage','Product Usage'],['recent','Recent Orders']].map(([id,label])=>(
          <button key={id} className={`mgr-tab ${tab===id?'mgr-tab--active':''}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      <div className="mgr-analytics-content">
        {/* X-Report */}
        {tab==='xreport' && (
          <div>
            <button className="mgr-run-btn" onClick={runXReport}>Run Hourly X-Report</button>
            {xData && <>
              <div className="mgr-subtable-title">Hourly Sales Breakdown</div>
              <DataTable
                columns={['Hour','Orders','Items Sold','Subtotal','Tax','Revenue']}
                rows={(xData.hourly||[]).map(r=>[
                  `${r.hr}:00`, r.num_orders, r.items_sold,
                  `$${parseFloat(r.subtotal).toFixed(2)}`, `$${parseFloat(r.tax).toFixed(2)}`, `$${parseFloat(r.revenue).toFixed(2)}`
                ])}
              />
              <div className="mgr-subtable-title">Payment Method Summary</div>
              <DataTable
                columns={['Payment Method','Orders','Total']}
                rows={(xData.payment||[]).map(r=>[r.method, r.num_orders, `$${parseFloat(r.total).toFixed(2)}`])}
              />
            </>}
          </div>
        )}

        {/* Z-Report */}
        {tab==='zreport' && (
          <div>
            <button className="mgr-run-btn mgr-btn--red" onClick={runZReport}>Run &amp; Close Out Z-Report (End of Day)</button>
            {zData && <>
              <div className="mgr-subtable-title">Sales &amp; Tax Summary</div>
              <DataTable
                columns={['Metric','Value']}
                rows={[
                  ['Total Orders', zData.summary.totalOrders],
                  ['Total Items Sold', zData.summary.totalItems],
                  ['Total Subtotal', `$${zData.summary.subtotal.toFixed(2)}`],
                  ['Total Tax', `$${zData.summary.tax.toFixed(2)}`],
                  ['Total Sales (Revenue)', `$${zData.summary.revenue.toFixed(2)}`],
                ]}
              />
              <div className="mgr-subtable-title">Payment Method Breakdown</div>
              <DataTable
                columns={['Payment Method','Orders','Total']}
                rows={(zData.payment||[]).map(r=>[r.method, r.num_orders, `$${parseFloat(r.total).toFixed(2)}`])}
              />
              <div className="mgr-subtable-title">Employee Order Breakdown</div>
              <DataTable
                columns={['Employee ID','Employee Name','Orders','Revenue']}
                rows={(zData.employees||[]).map(r=>[r.employee_id, r.emp_name, r.num_orders, `$${parseFloat(r.revenue).toFixed(2)}`])}
              />
            </>}
          </div>
        )}

        {/* Sales Report */}
        {tab==='sales' && (
          <div>
            <div className="mgr-date-row">
              <label>Start Date:</label><input type="date" value={salesStart} onChange={e=>setSalesStart(e.target.value)} />
              <label>End Date:</label><input type="date" value={salesEnd} onChange={e=>setSalesEnd(e.target.value)} />
              <button className="mgr-run-btn" onClick={runSales}>Generate Sales Report</button>
            </div>
            {salesData && <DataTable
              columns={['Menu Item','Quantity Sold','Total Revenue']}
              rows={(salesData||[]).map(r=>[r.item_name, r.qty, `$${parseFloat(r.revenue).toFixed(2)}`])}
            />}
          </div>
        )}

        {/* Product Usage */}
        {tab==='usage' && (
          <div>
            <div className="mgr-date-row">
              <label>Start Date:</label><input type="date" value={usageStart} onChange={e=>setUsageStart(e.target.value)} />
              <label>End Date:</label><input type="date" value={usageEnd} onChange={e=>setUsageEnd(e.target.value)} />
              <button className="mgr-run-btn" onClick={runUsage}>Generate Usage Chart</button>
            </div>
            {usageData && <DataTable
              columns={['Ingredient','Amount Used','Unit']}
              rows={(usageData||[]).map(r=>[r.item_name, r.amount_used.toFixed(2), r.unit])}
            />}
          </div>
        )}

        {/* Recent Orders */}
        {tab==='recent' && (
          <div>
            <div style={{marginBottom:8}}>
              <button className="mgr-run-btn" onClick={loadRecent}>Refresh</button>
            </div>
            <DataTable
              columns={['Order ID','Created At','Employee','Status','Subtotal','Tax','Total','Payment']}
              rows={recentOrders.map(r=>[
                r.order_id,
                new Date(r.created_at).toLocaleString(),
                r.employee_name,
                r.status,
                `$${r.subtotal.toFixed(2)}`,
                `$${r.tax.toFixed(2)}`,
                `$${r.total.toFixed(2)}`,
                r.payment_method || 'Cash',
              ])}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard Panel ───
function DashboardPanel() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    fetch(`${API}/analytics/recent-orders`).then(r=>r.json()).then(orders => {
      if (!orders.length) return
      const today = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
      const totalRevenue = today.reduce((s,o) => s+o.total, 0)
      setStats({ count: today.length, revenue: totalRevenue })
    })
  }, [])
  return (
    <div className="mgr-panel mgr-dashboard">
      <h2>Today&apos;s Summary</h2>
      {stats ? <>
        <p>Today there were <strong>{stats.count}</strong> orders with <strong>${stats.revenue.toFixed(2)}</strong> in sales!</p>
      </> : <p>Loading dashboard...</p>}
    </div>
  )
}

// ─── Main Manager App ───
const NAV_ITEMS = [
  { key: 'menu', label: 'Menu' },
  { key: 'recent', label: 'Recent Transactions' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'employee', label: 'Employee' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'reports', label: 'Reports' },
  { key: 'analytics', label: 'Analytics' },
]

export default function ManagerApp() {
  const [employee, setEmployee] = useState(null)
  const [loginId, setLoginId] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activePanel, setActivePanel] = useState('dashboard')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: loginId }),
    })
    const data = await res.json()
    if (!res.ok) { setLoginError(data.error || 'Login failed'); return }
    if (data.role.toLowerCase() !== 'manager') {
      setLoginError('Only managers can access this view.')
      return
    }
    setEmployee(data)
  }

  const handleLogout = () => { setEmployee(null); setLoginId(''); setLoginError('') }

  if (!employee) {
    return (
      <div className="cashier-login">
        <h1 className="cashier-login__title">DRAGON BOBA — Manager</h1>
        <form className="cashier-login__form" onSubmit={handleLogin}>
          <label>Employee ID:</label>
          <input type="text" value={loginId} onChange={e=>setLoginId(e.target.value)} autoFocus />
          {loginError && <p className="cashier-login__error">{loginError}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    )
  }

  const renderPanel = () => {
    switch (activePanel) {
      case 'menu': return <MenuPanel />
      case 'inventory': return <InventoryPanel />
      case 'employee': return <EmployeePanel />
      case 'reports': return <ReportsPanel />
      case 'analytics': return <AnalyticsPanel />
      case 'recent': return <AnalyticsPanel initialTab="recent" />
      default: return <DashboardPanel />
    }
  }

  return (
    <div className="manager">
      {/* LEFT NAV SIDEBAR */}
      <nav className="manager__nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`manager__nav-btn ${activePanel===item.key?'manager__nav-btn--active':''}`}
            onClick={() => setActivePanel(item.key)}
          >
            {item.label}
          </button>
        ))}
        <button className="manager__nav-btn manager__nav-btn--logout" onClick={handleLogout}>
          Employee Log-In
        </button>
      </nav>

      {/* CENTER CONTENT */}
      <main className="manager__content">
        {renderPanel()}
      </main>
    </div>
  )
}
