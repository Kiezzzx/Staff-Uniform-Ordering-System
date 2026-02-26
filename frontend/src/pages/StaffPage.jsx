import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageTitle from '../components/PageTitle'
import ErrorAlert from '../components/ErrorAlert'

export default function StaffPage() {
  const [items, setItems] = useState([])
  const [roleLimits, setRoleLimits] = useState([])
  const [selectedRole, setSelectedRole] = useState('')
  const [annualLimit, setAnnualLimit] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const load = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const [staffRes, limitsRes] = await Promise.all([api.getStaff(), api.getRoleLimits()])
      const loadedStaff = staffRes.items || []
      const loadedLimits = limitsRes.items || []
      setItems(loadedStaff)
      setRoleLimits(loadedLimits)

      if (!selectedRole && loadedLimits.length > 0) {
        setSelectedRole(loadedLimits[0].role)
        setAnnualLimit(String(loadedLimits[0].annualLimit))
      }
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRoleChange = (event) => {
    const nextRole = event.target.value
    setSelectedRole(nextRole)
    const matched = roleLimits.find((item) => item.role === nextRole)
    setAnnualLimit(matched ? String(matched.annualLimit) : '')
    setSuccessMessage('')
  }

  const handleSaveLimit = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    const parsedLimit = Number(annualLimit)
    if (!selectedRole || !Number.isInteger(parsedLimit) || parsedLimit < 0) {
      setErrorMessage('Please select a role and enter a valid annual limit.')
      return
    }

    setIsSaving(true)
    try {
      await api.updateRoleLimit(selectedRole, parsedLimit)
      setSuccessMessage('Role allowance limit updated.')
      await load()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section>
      <PageTitle title="Staff" subtitle="Reference table for planning and allowance context." />
      <ErrorAlert message={errorMessage} />

      {successMessage ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Role Allowance Limits</h2>
        <p className="mt-1 text-xs text-slate-600">Set annual allowance per role.</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <select
            value={selectedRole}
            onChange={handleRoleChange}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select role</option>
            {roleLimits.map((item) => (
              <option key={item.role} value={item.role}>
                {item.role}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            step="1"
            value={annualLimit}
            onChange={(event) => setAnnualLimit(event.target.value)}
            placeholder="Annual limit"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="button"
            onClick={handleSaveLimit}
            disabled={isSaving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300"
          >
            {isSaving ? 'Saving...' : 'Save Limit'}
          </button>
        </div>
      </div>

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
