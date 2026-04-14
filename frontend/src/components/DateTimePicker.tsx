import { useState, useEffect, useRef } from 'react'

interface Props {
  value: string
  min?: string
  onChange: (val: string) => void
}

const DAYS = ['日', '一', '二', '三', '四', '五', '六']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatDisplay(val: string) {
  if (!val) return null
  const [datePart, timePart] = val.split('T')
  if (!datePart) return null
  const [, month, day] = datePart.split('-')
  const [h, m] = (timePart || '').split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${month}/${day}  ${pad(hour12)}:${pad(m)} ${ampm}`
}

// Generate 15-min interval time slots
const TIME_SLOTS: string[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_SLOTS.push(`${pad(h)}:${pad(m)}`)
  }
}

function timeSlotLabel(slot: string) {
  const [h, m] = slot.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${pad(hour12)}:${pad(m)} ${ampm}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function DateTimePicker({ value, min, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeListRef = useRef<HTMLDivElement>(null)

  const now = new Date()
  const selectedDateStr = value ? value.split('T')[0] : ''
  const selectedTimeStr = value ? (value.split('T')[1] || '') : ''

  const [viewYear, setViewYear] = useState(
    value ? parseInt(value.slice(0, 4)) : now.getFullYear()
  )
  const [viewMonth, setViewMonth] = useState(
    value ? parseInt(value.slice(5, 7)) - 1 : now.getMonth()
  )

  const minDateStr = min ? min.split('T')[0] : ''

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Scroll time list to selected or current time
  useEffect(() => {
    if (!open || !timeListRef.current) return
    const target = selectedTimeStr || `${pad(now.getHours())}:00`
    const idx = TIME_SLOTS.findIndex((s) => s === target || s >= target)
    const el = timeListRef.current.children[Math.max(0, idx - 2)] as HTMLElement
    if (el) el.scrollIntoView({ block: 'start' })
  }, [open])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function selectDate(dateStr: string) {
    const time = selectedTimeStr || `${pad(now.getHours())}:${now.getMinutes() < 30 ? '00' : '30'}`
    onChange(`${dateStr}T${time}`)
  }

  function selectTime(timeStr: string) {
    const date = selectedDateStr || toDateStr(now)
    onChange(`${date}T${timeStr}`)
  }

  function isDateDisabled(dateStr: string) {
    if (!minDateStr) return false
    return dateStr < minDateStr
  }

  function isTimeDisabled(timeStr: string) {
    const todayStr = toDateStr(now)
    const effectiveDate = selectedDateStr || todayStr
    if (effectiveDate > todayStr) return false
    if (effectiveDate < todayStr) return true
    const [h, m] = timeStr.split(':').map(Number)
    const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
    return slotDate <= now
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)
  const todayStr = toDateStr(now)

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long' })

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: '1px solid var(--border)',
          color: value ? 'var(--cream)' : 'var(--muted)',
          padding: '0.45rem 0.6rem',
          fontSize: '0.8rem',
          cursor: 'pointer',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {formatDisplay(value) ?? '截止时间'}
      </button>

      {/* Popover */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 100,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            width: 320,
          }}
        >
          <div style={{ display: 'flex' }}>
            {/* Calendar */}
            <div style={{ flex: 1, padding: '12px' }}>
              {/* Month nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={prevMonth}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px' }}
                >
                  ‹
                </button>
                <span style={{ fontSize: '0.78rem', color: 'var(--cream)', letterSpacing: '0.06em', fontWeight: 500 }}>
                  {monthName} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px' }}
                >
                  ›
                </button>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                {DAYS.map((d) => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.62rem', color: 'var(--muted)', padding: '2px 0', letterSpacing: '0.04em' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
                  const isSelected = dateStr === selectedDateStr
                  const isToday = dateStr === todayStr
                  const disabled = isDateDisabled(dateStr)

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDate(dateStr)}
                      style={{
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        padding: '4px 0',
                        borderRadius: '50%',
                        border: isToday && !isSelected ? '1px solid var(--gold)' : 'none',
                        backgroundColor: isSelected ? 'var(--gold)' : 'transparent',
                        color: disabled ? 'var(--muted)' : isSelected ? 'var(--bg)' : isToday ? 'var(--gold)' : 'var(--cream)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.35 : 1,
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'background 0.15s',
                      }}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', backgroundColor: 'var(--border)' }} />

            {/* Time list */}
            <div
              ref={timeListRef}
              style={{
                width: 100,
                overflowY: 'auto',
                maxHeight: 220,
                padding: '4px 0',
                scrollbarWidth: 'thin',
              }}
            >
              {TIME_SLOTS.map((slot) => {
                const isSelected = slot === selectedTimeStr
                const disabled = isTimeDisabled(slot)
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectTime(slot)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '5px 10px',
                      fontSize: '0.72rem',
                      background: 'none',
                      border: 'none',
                      borderLeft: isSelected ? '2px solid var(--gold)' : '2px solid transparent',
                      color: disabled ? 'var(--muted)' : isSelected ? 'var(--gold)' : 'var(--cream)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.35 : 1,
                      fontWeight: isSelected ? 600 : 400,
                      letterSpacing: '0.02em',
                      transition: 'color 0.12s, background 0.12s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled && !isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {timeSlotLabel(slot)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.7rem', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brick)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
            >
              清除
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.7rem', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
