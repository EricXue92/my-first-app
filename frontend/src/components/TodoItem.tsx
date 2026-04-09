import { useState } from 'react'
import type { Todo, Priority } from '../types'
import { useTodoStore } from '../store/todoStore'

const priorityColors: Record<Priority, string> = {
  high: 'border-red-500/50 bg-red-500/5',
  medium: 'border-yellow-500/50 bg-yellow-500/5',
  low: 'border-gray-600 bg-transparent',
}

const priorityLabels: Record<Priority, string> = {
  high: '🔴 高',
  medium: '🟡 中',
  low: '🟢 低',
}

export default function TodoItem({ todo }: { todo: Todo }) {
  const { toggleTodo, deleteTodo, updateTodo } = useTodoStore((s) => ({
    toggleTodo: s.toggleTodo,
    deleteTodo: s.deleteTodo,
    updateTodo: s.updateTodo,
  }))
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)

  const handleSave = async () => {
    if (!editTitle.trim()) return
    await updateTodo(todo.id, { title: editTitle.trim() })
    setEditing(false)
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border rounded-md ${priorityColors[todo.priority]} ${todo.completed ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
        className="w-4 h-4 cursor-pointer accent-blue-400"
      />
      <div className="flex-1">
        {editing ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="w-full bg-transparent border-b border-blue-400 outline-none text-sm text-white"
          />
        ) : (
          <p className={`text-sm font-medium text-white ${todo.completed ? 'line-through' : ''}`}>
            {todo.title}
          </p>
        )}
        <p className="text-xs text-white/40 mt-0.5">
          {todo.due_date && `📅 ${todo.due_date} · `}
          {priorityLabels[todo.priority]}
        </p>
      </div>
      <button onClick={() => setEditing(true)} aria-label="✏️" className="opacity-40 hover:opacity-80 text-sm">✏️</button>
      <button onClick={() => deleteTodo(todo.id)} aria-label="🗑️" className="opacity-40 hover:opacity-80 text-sm">🗑️</button>
    </div>
  )
}
