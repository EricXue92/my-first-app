export type Priority = 'low' | 'medium' | 'high'

export interface User {
  id: number
  username: string
  email: string
  created_at: string
}

export interface Todo {
  id: number
  user_id: number
  title: string
  description: string | null
  completed: boolean
  priority: Priority
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface TodoCreate {
  title: string
  description?: string
  priority?: Priority
  due_date?: string
}

export interface TodoUpdate {
  title?: string
  description?: string
  priority?: Priority
  due_date?: string
}
