import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Todo } from '../../types'

const mockTodo: Todo = {
  id: 1, user_id: 1, title: 'Buy groceries', description: null,
  completed: false, priority: 'high', due_date: '2026-04-15',
  created_at: '2026-04-08T00:00:00', updated_at: '2026-04-08T00:00:00',
}

const mockToggle = vi.fn()
const mockDelete = vi.fn()

vi.mock('../../store/todoStore', () => ({
  useTodoStore: vi.fn((selector) =>
    selector({ toggleTodo: mockToggle, deleteTodo: mockDelete, updateTodo: vi.fn() })
  ),
}))

describe('TodoItem', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders title and due date', async () => {
    const { default: TodoItem } = await import('../TodoItem')
    render(<TodoItem todo={mockTodo} />)
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    expect(screen.getByText(/2026-04-15/)).toBeInTheDocument()
  })

  it('calls toggleTodo on checkbox click', async () => {
    const { default: TodoItem } = await import('../TodoItem')
    render(<TodoItem todo={mockTodo} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(mockToggle).toHaveBeenCalledWith(1)
  })

  it('calls deleteTodo on delete button click', async () => {
    const { default: TodoItem } = await import('../TodoItem')
    render(<TodoItem todo={mockTodo} />)
    await userEvent.click(screen.getByRole('button', { name: '🗑️' }))
    expect(mockDelete).toHaveBeenCalledWith(1)
  })
})
