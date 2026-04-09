import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import api from '../../api/axios'

describe('authStore', () => {
  beforeEach(async () => {
    localStorage.clear()
    vi.clearAllMocks()
    const { useAuthStore } = await import('../authStore')
    useAuthStore.setState({ user: null, token: null })
  })

  it('login sets token and fetches user', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { access_token: 'test-token', token_type: 'bearer' },
    })
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { id: 1, username: 'alice', email: 'alice@example.com', created_at: '2026-04-08' },
    })

    const { useAuthStore } = await import('../authStore')
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login('alice', 'password')
    })

    expect(result.current.token).toBe('test-token')
    expect(result.current.user?.username).toBe('alice')
    expect(localStorage.getItem('token')).toBe('test-token')
  })

  it('logout clears token and user', async () => {
    const { useAuthStore } = await import('../authStore')
    useAuthStore.setState({
      user: { id: 1, username: 'alice', email: 'a@a.com', created_at: '' },
      token: 'some-token',
    })
    localStorage.setItem('token', 'some-token')

    const { result } = renderHook(() => useAuthStore())
    act(() => result.current.logout())

    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
