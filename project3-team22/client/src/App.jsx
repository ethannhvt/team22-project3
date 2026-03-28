import { Routes, Route } from 'react-router-dom'
import Portal from './pages/Portal'
import CustomerApp from './pages/customer/CustomerApp'
import CashierApp from './pages/cashier/CashierApp'
import ManagerApp from './pages/manager/ManagerApp'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Portal />} />
      <Route path="/customer/*" element={<CustomerApp />} />
      <Route path="/cashier/*" element={<CashierApp />} />
      <Route path="/manager/*" element={<ManagerApp />} />
    </Routes>
  )
}

export default App
