import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageTitle from '../components/PageTitle'
import ErrorAlert from '../components/ErrorAlert'

export default function StaffPage() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const res = await api.getStaff()
        setItems(res.items || [])
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  return (
    <section>
      <PageTitle title="Staff" subtitle="Reference table for planning and allowance context." />
      <ErrorAlert message={errorMessage} />

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-3 py-2 font-bold">ID</th>
              <th className="px-3 py-2 font-bold">Name</th>
              <th className="px-3 py-2 font-bold">Role</th>
              <th className="px-3 py-2 font-bold">Store</th>
              <th className="px-3 py-2 font-bold">Remaining Allowance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" className="px-3 py-6 text-center text-slate-500">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="5" className="px-3 py-6 text-center text-slate-500">No staff data.</td></tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100`}>
                  <td className="px-3 py-2">{item.id}</td>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">{item.role}</td>
                  <td className="px-3 py-2">{item.storeName}</td>
                  <td className="px-3 py-2">{item.remainingAllowance}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
