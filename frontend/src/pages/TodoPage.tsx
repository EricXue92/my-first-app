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
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <TodoForm />
        <FilterBar />
        <TodoList />
      </main>
    </div>
  )
}
