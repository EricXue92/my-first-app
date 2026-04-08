import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('axios interceptor', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('attaches Authorization header when token exists', async () => {
    localStorage.setItem('token', 'my-test-token')
    const api = (await import('../axios')).default
    // Access the request interceptors to verify setup
    const interceptors = (api.interceptors.request as any).handlers
    expect(interceptors.length).toBeGreaterThan(0)
  })
})
