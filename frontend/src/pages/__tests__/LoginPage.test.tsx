import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn(),
      logout: vi.fn(),
      user: null,
      token: null,
      fetchMe: vi.fn(),
    })
  ),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

describe('LoginPage', () => {
  it('renders username and password fields', async () => {
    const { default: LoginPage } = await import('../LoginPage')
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
  })

  it('shows error on failed login', async () => {
    const { useAuthStore } = await import('../../store/authStore')
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        login: vi.fn().mockRejectedValue(new Error('Unauthorized')),
        register: vi.fn(),
        logout: vi.fn(),
        user: null,
        token: null,
        fetchMe: vi.fn(),
      })
    )
    const { default: LoginPage } = await import('../LoginPage')
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    await userEvent.type(screen.getByPlaceholderText('用户名'), 'alice')
    await userEvent.type(screen.getByPlaceholderText('密码'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: '登录' }))
    expect(await screen.findByText('用户名或密码错误')).toBeInTheDocument()
  })
})
