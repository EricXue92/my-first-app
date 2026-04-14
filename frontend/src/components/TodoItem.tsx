import { useState } from 'react'
import type { Todo, Priority } from '../types'
import { useTodoStore } from '../store/todoStore'
import DateTimePicker from './DateTimePicker'

const priorityBar: Record<Priority, string> = {
  high: 'var(--brick)',
  medium: 'var(--clay)',
  low: 'var(--sage)',
}

const priorityLabel: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export default function TodoItem({ todo }: { todo: Todo }) {
  const toggleTodo = useTodoStore((s) => s.toggleTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [editDueDate, setEditDueDate] = useState(todo.due_date ?? '')
  const [hovered, setHovered] = useState(false)

  const handleEdit = () => {
    setEditTitle(todo.title)
    setEditDueDate(todo.due_date ?? '')
    setEditing(true)
  }

  const handleSave = async () => {
    if (!editTitle.trim()) return
    await updateTodo(todo.id, {
      title: editTitle.trim(),
      due_date: editDueDate || undefined,
    })
    setEditing(false)
  }

  const handleCancel = () => {
    setEditing(false)
  }

  return (
    <div
      className="todo-enter flex items-center gap-4 px-5 py-4 transition-all"
      style={{
        backgroundColor: hovered ? '#E4F2F1' : 'var(--surface-2)',
        borderLeft: `3px solid ${priorityBar[todo.priority]}`,
        borderTop: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        opacity: todo.completed ? 0.5 : 1,
        position: 'relative',
        zIndex: editing ? 20 : 'auto',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Custom checkbox */}
      <button
        onClick={() => toggleTodo(todo.id)}
        aria-label="toggle"
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: `1.5px solid ${todo.completed ? 'var(--gold)' : 'var(--muted)'}`,
          backgroundColor: todo.completed ? 'var(--gold)' : 'transparent',
          flexShrink: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          padding: 0,
        }}
      >
        {todo.completed && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
              autoFocus
              className="w-full bg-transparent outline-none text-sm"
              style={{
                color: 'var(--cream)',
                borderBottom: '1px solid var(--gold)',
                paddingBottom: '2px',
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <DateTimePicker value={editDueDate} onChange={setEditDueDate} />
              <button
                type="button"
                onClick={handleSave}
                style={{
                  padding: '0.3rem 0.7rem',
                  fontSize: '0.72rem',
                  fontFamily: 'DM Sans, sans-serif',
                  backgroundColor: 'var(--gold)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                }}
              >
                保存
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.72rem',
                  fontFamily: 'DM Sans, sans-serif',
                  backgroundColor: 'transparent',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-sm font-medium truncate"
            style={{
              color: 'var(--cream)',
              textDecoration: todo.completed ? 'line-through' : 'none',
            }}
          >
            {todo.title}
          </p>
        )}
        {!editing && (
          <div className="flex items-center gap-3 mt-1">
            {todo.due_date && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {todo.due_date.replace('T', ' ').slice(0, 16)}
              </span>
            )}
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: priorityBar[todo.priority], letterSpacing: '0.08em', fontSize: '0.65rem' }}
            >
              {priorityLabel[todo.priority]}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-3 transition-opacity"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        <button
          onClick={handleEdit}
          aria-label="编辑"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, lineHeight: 1 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cream)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={() => deleteTodo(todo.id)}
          aria-label="删除"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, lineHeight: 1 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brick)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
