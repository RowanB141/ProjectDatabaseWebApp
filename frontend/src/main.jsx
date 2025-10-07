import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './pages/Login/Login.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'

// Creates a router configuration with route definitions mapping URL paths to React components
const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
])

// Mounts the React application to the DOM element with id 'root' and wraps it with the router provider to enable client-side navigation
ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)
