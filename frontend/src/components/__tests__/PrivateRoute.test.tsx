import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '../../store/authStore'

describe('PrivateRoute', () => {
  it('renders children when token exists', async () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({ token: 'valid-token', user: null, login: vi.fn(), logout: vi.fn(), register: vi.fn(), fetchMe: vi.fn() })
    )
    const { default: PrivateRoute } = await import('../PrivateRoute')
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PrivateRoute><div>Protected Content</div></PrivateRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /login when no token', async () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({ token: null, user: null, login: vi.fn(), logout: vi.fn(), register: vi.fn(), fetchMe: vi.fn() })
    )
    const { default: PrivateRoute } = await import('../PrivateRoute')
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PrivateRoute><div>Protected Content</div></PrivateRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
