import React from 'react'

export default function StatusBadge({ status }) {
  const styles = {
    REQUESTED: 'bg-slate-100 text-slate-700',
    DISPATCHED: 'bg-blue-100 text-blue-700',
    ARRIVED: 'bg-amber-100 text-amber-800',
    COLLECTED: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.REQUESTED}`}>
      {status}
    </span>
  )
}
