import { useTodoStore } from '../store/todoStore'
import type { Priority } from '../types'

const statusFilters = [
  { label: '全部', value: 'all' as const },
  { label: '进行中', value: 'active' as const },
  { label: '已完成', value: 'completed' as const },
]

const priorityFilters: { label: string; value: Priority | null }[] = [
  { label: '全部', value: null },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

export default function FilterBar() {
  const filterStatus = useTodoStore((s) => s.filterStatus)
  const filterPriority = useTodoStore((s) => s.filterPriority)
  const setFilterStatus = useTodoStore((s) => s.setFilterStatus)
  const setFilterPriority = useTodoStore((s) => s.setFilterPriority)

  return (
    <div className="flex items-center gap-6 mb-6 flex-wrap">
      <div className="flex items-center gap-5">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`filter-tab ${filterStatus === f.value ? 'active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1" style={{ color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
        <span className="uppercase tracking-widest mr-2" style={{ fontSize: '0.65rem' }}>优先级</span>
        {priorityFilters.map((f) => (
          <button
            key={String(f.value)}
            onClick={() => setFilterPriority(f.value)}
            className={`filter-tab ${filterPriority === f.value ? 'active' : ''}`}
            style={{ marginLeft: '0.75rem' }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
