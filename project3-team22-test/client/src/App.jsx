import { Routes, Route } from 'react-router-dom'
import Portal from './pages/Portal'
import CustomerApp from './pages/customer/CustomerApp'
import CashierApp from './pages/cashier/CashierApp'
import ManagerApp from './pages/manager/ManagerApp'
import MenuBoard from './pages/menuboard/MenuBoard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Portal />} />
      <Route path="/customer/*" element={<CustomerApp />} />
      <Route path="/cashier/*" element={<CashierApp />} />
      <Route path="/manager/*" element={<ManagerApp />} />
      <Route path="/menuboard/*" element={<MenuBoard />} />
    </Routes>
  )
}

export default App
