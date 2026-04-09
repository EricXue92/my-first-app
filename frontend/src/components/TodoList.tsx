import { useTodoStore } from '../store/todoStore'
import TodoItem from './TodoItem'

export default function TodoList() {
  const todos = useTodoStore((s) => s.todos)
  const filterStatus = useTodoStore((s) => s.filterStatus)
  const filterPriority = useTodoStore((s) => s.filterPriority)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)

  const filtered = todos.filter((t) => {
    if (filterStatus === 'active' && t.completed) return false
    if (filterStatus === 'completed' && !t.completed) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const completedCount = todos.filter((t) => t.completed).length

  const clearCompleted = () => {
    todos.filter((t) => t.completed).forEach((t) => deleteTodo(t.id))
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        {filtered.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-white/30 py-8 text-sm">暂无待办事项</p>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs text-white/40">
        <span>共 {todos.length} 条 · {todos.length - completedCount} 条进行中</span>
        {completedCount > 0 && (
          <button onClick={clearCompleted} className="hover:text-white/70 transition">
            清除已完成
          </button>
        )}
      </div>
    </div>
  )
}
