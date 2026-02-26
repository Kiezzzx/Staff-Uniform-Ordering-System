import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import PageTitle from '../components/PageTitle'
import ErrorAlert from '../components/ErrorAlert'

export default function UniformItemsPage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const res = await api.getUniformItems()
        setItems(res.items || [])
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items

    return items.filter((item) => {
      return item.itemName.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q)
    })
  }, [items, search])

  return (
    <section>
      <PageTitle title="Uniform Items" subtitle="Reference stock table with low-stock visibility." />
      <ErrorAlert message={errorMessage} />

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by item name or SKU"
        className="mb-4 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:max-w-md"
      />

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-3 py-2 font-bold">ID</th>
              <th className="px-3 py-2 font-bold">SKU</th>
              <th className="px-3 py-2 font-bold">Item Name</th>
              <th className="px-3 py-2 font-bold">Size</th>
              <th className="px-3 py-2 font-bold">Stock On Hand</th>
              <th className="px-3 py-2 font-bold">Low Stock</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" className="px-3 py-6 text-center text-slate-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" className="px-3 py-6 text-center text-slate-500">No items found.</td></tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100 ${item.isLowStock ? 'bg-amber-50' : ''}`}>
                  <td className="px-3 py-2">{item.id}</td>
                  <td className="px-3 py-2">{item.sku}</td>
                  <td className="px-3 py-2">{item.itemName}</td>
                  <td className="px-3 py-2">{item.size}</td>
                  <td className="px-3 py-2">{item.stockOnHand}</td>
                  <td className="px-3 py-2">
                    {item.isLowStock ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Low Stock</span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
