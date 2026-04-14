import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockFetchMe = vi.fn()
const mockSetToken = vi.fn()
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({ fetchMe: mockFetchMe, setToken: mockSetToken })
  ),
}))

describe('OAuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockFetchMe.mockResolvedValue(undefined)
    window.history.replaceState = vi.fn()
  })

  it('stores token and navigates to / on success', async () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?token=jwt-123' },
      writable: true,
    })

    const { default: OAuthCallbackPage } = await import('../OAuthCallbackPage')
    render(
      <MemoryRouter>
        <OAuthCallbackPage />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(mockSetToken).toHaveBeenCalledWith('jwt-123')
    })
    await vi.waitFor(() => {
      expect(mockFetchMe).toHaveBeenCalled()
    })
    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('shows error message when error param present', async () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?error=授权失败' },
      writable: true,
    })

    const { default: OAuthCallbackPage } = await import('../OAuthCallbackPage')
    render(
      <MemoryRouter>
        <OAuthCallbackPage />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(screen.getByText('授权失败')).toBeInTheDocument()
    })
    expect(screen.getByText('返回登录')).toBeInTheDocument()
  })

  it('shows default error when no params', async () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '' },
      writable: true,
    })

    const { default: OAuthCallbackPage } = await import('../OAuthCallbackPage')
    render(
      <MemoryRouter>
        <OAuthCallbackPage />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(screen.getByText('登录失败，请重试')).toBeInTheDocument()
    })
  })
})
