import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useTodoStore } from '../store/todoStore'
import Navbar from '../components/Navbar'
import TodoForm from '../components/TodoForm'
import FilterBar from '../components/FilterBar'
import TodoList from '../components/TodoList'

export default function TodoPage() {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const fetchTodos = useTodoStore((s) => s.fetchTodos)

  useEffect(() => {
    fetchMe()
    fetchTodos()
  }, [fetchMe, fetchTodos])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--cream)' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1
          className="font-cormorant mb-8"
          style={{
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--cream)',
            letterSpacing: '0.05em',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '1.5rem',
          }}
        >
          我的任务
        </h1>
        <TodoForm />
        <FilterBar />
        <TodoList />
      </main>
    </div>
  )
}
