import React from 'react'
import { ClipboardList, FileUp, Package, Shirt, Users } from 'lucide-react'

const iconByKey = {
  'create-request': Shirt,
  requests: ClipboardList,
  'import-data': FileUp,
  staff: Users,
  'uniform-items': Package,
}

export default function AppLayout({ tabs, activeTab, onTabChange, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-600 text-white">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-3">
          <div className="flex min-w-0 items-center gap-8">
            <h1 className="text-lg font-semibold">Staff Uniform Ordering</h1>
            <nav className="flex flex-wrap items-center gap-4">
              {tabs.map((tab) => {
                const Icon = iconByKey[tab.key]

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className={`inline-flex items-center gap-1.5 text-sm transition ${
                      activeTab === tab.key
                        ? 'font-semibold text-white'
                        : 'text-indigo-100 hover:text-white'
                    }`}
                  >
                    {Icon ? <Icon size={14} /> : null}
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
