import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Lottie from 'lottie-react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Pay from './pages/Pay'
import Repay from './pages/Repay'
import Verify from './pages/Verify'
import Username from './pages/Username'
import Layout from './components/Layout'

// Compatibility shim: @selfxyz/qrcode references Lottie.default
// Ensure the imported function also exists on .default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(Lottie as any).default) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(Lottie as any).default = Lottie
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <App /> },
      { path: 'pay', element: <Pay /> },
      { path: 'repay', element: <Repay /> },
      { path: 'verify', element: <Verify /> },
      { path: 'username', element: <Username /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
