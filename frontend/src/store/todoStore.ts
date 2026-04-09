import { create } from 'zustand'
import type { Todo, TodoCreate, TodoUpdate, Priority } from '../types'
import api from '../api/axios'

type FilterStatus = 'all' | 'active' | 'completed'

interface TodoState {
  todos: Todo[]
  filterStatus: FilterStatus
  filterPriority: Priority | null
  fetchTodos: () => Promise<void>
  createTodo: (data: TodoCreate) => Promise<void>
  updateTodo: (id: number, data: TodoUpdate) => Promise<void>
  toggleTodo: (id: number) => Promise<void>
  deleteTodo: (id: number) => Promise<void>
  setFilterStatus: (status: FilterStatus) => void
  setFilterPriority: (priority: Priority | null) => void
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  filterStatus: 'all',
  filterPriority: null,

  fetchTodos: async () => {
    const { data } = await api.get('/todos')
    set({ todos: data })
  },

  createTodo: async (todoData) => {
    const { data } = await api.post('/todos', todoData)
    set((state) => ({ todos: [data, ...state.todos] }))
  },

  updateTodo: async (id, todoData) => {
    const { data } = await api.put(`/todos/${id}`, todoData)
    set((state) => ({ todos: state.todos.map((t) => (t.id === id ? data : t)) }))
  },

  toggleTodo: async (id) => {
    const { data } = await api.patch(`/todos/${id}/toggle`)
    set((state) => ({ todos: state.todos.map((t) => (t.id === id ? data : t)) }))
  },

  deleteTodo: async (id) => {
    await api.delete(`/todos/${id}`)
    set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }))
  },

  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
}))
