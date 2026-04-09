import { useState } from 'react'
import { useTodoStore } from '../store/todoStore'
import type { Priority } from '../types'

export default function TodoForm() {
  const createTodo = useTodoStore((s) => s.createTodo)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await createTodo({ title: title.trim(), priority, due_date: dueDate || undefined })
    setTitle('')
    setPriority('medium')
    setDueDate('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4 flex-wrap">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="输入新的待办事项..."
        className="flex-1 min-w-48 border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        className="border border-gray-600 bg-gray-700 text-white rounded px-2 py-2 text-sm"
      >
        <option value="high">🔴 高</option>
        <option value="medium">🟡 中</option>
        <option value="low">🟢 低</option>
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="border border-gray-600 bg-gray-700 text-white rounded px-2 py-2 text-sm"
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm transition"
      >
        + 添加
      </button>
    </form>
  )
}
