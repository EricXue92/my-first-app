import { useTodoStore } from '../store/todoStore'
import type { Priority } from '../types'

const statusFilters = [
  { label: '全部', value: 'all' as const },
  { label: '进行中', value: 'active' as const },
  { label: '已完成', value: 'completed' as const },
]

const priorityFilters: { label: string; value: Priority | null }[] = [
  { label: '全部优先级', value: null },
  { label: '🔴 高', value: 'high' },
  { label: '🟡 中', value: 'medium' },
  { label: '🟢 低', value: 'low' },
]

export default function FilterBar() {
  const { filterStatus, filterPriority, setFilterStatus, setFilterPriority } = useTodoStore()

  return (
    <div className="flex gap-2 flex-wrap mb-4 text-sm">
      {statusFilters.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilterStatus(f.value)}
          className={`px-3 py-1 rounded-full border transition ${
            filterStatus === f.value
              ? 'bg-blue-600/30 border-blue-400/60 text-blue-300'
              : 'border-white/15 text-white/60 hover:border-white/30'
          }`}
        >
          {f.label}
        </button>
      ))}
      <div className="flex-1" />
      {priorityFilters.map((f) => (
        <button
          key={String(f.value)}
          onClick={() => setFilterPriority(f.value)}
          className={`px-3 py-1 rounded-full border transition ${
            filterPriority === f.value
              ? 'bg-blue-600/30 border-blue-400/60 text-blue-300'
              : 'border-white/15 text-white/60 hover:border-white/30'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
