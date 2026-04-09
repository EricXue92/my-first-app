import { useState } from 'react'
import { useTodoStore } from '../store/todoStore'
import type { Priority } from '../types'
import DateTimePicker from './DateTimePicker'

function getMinDateTime() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`
}

export default function TodoForm() {
  const createTodo = useTodoStore((s) => s.createTodo)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('low')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await createTodo({ title: title.trim(), priority, due_date: dueDate || undefined })
    setTitle('')
    setPriority('low')
    setDueDate('')
  }

  const priorityClass = (p: Priority) => {
    if (priority !== p) return ''
    return p === 'high' ? 'active-high' : p === 'medium' ? 'active-medium' : 'active-low'
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 p-6"
      style={{
        backgroundColor: 'var(--surface-2)',
        border: '1px solid var(--border)',
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="记录新的任务..."
        className="input-underline text-base mb-5"
        style={{ fontSize: '1.05rem' }}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="priority-seg">
          {(['high', 'medium', 'low'] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={priorityClass(p)}
            >
              {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
            </button>
          ))}
        </div>
        <DateTimePicker
          value={dueDate}
          min={getMinDateTime()}
          onChange={setDueDate}
        />
        <button
          type="submit"
          className="px-6 py-2 text-sm tracking-widest uppercase font-medium transition-opacity"
          style={{
            backgroundColor: 'var(--gold)',
            color: 'var(--bg)',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}
        >
          + 添加
        </button>
      </div>
    </form>
  )
}
