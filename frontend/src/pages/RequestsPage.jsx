import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import PageTitle from '../components/PageTitle'
import ErrorAlert from '../components/ErrorAlert'
import StatusBadge from '../components/StatusBadge'

const nextStatusMap = {
  REQUESTED: 'DISPATCHED',
  DISPATCHED: 'ARRIVED',
  ARRIVED: 'COLLECTED',
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RequestsPage() {
  const [items, setItems] = useState([])
  const [staffItems, setStaffItems] = useState([])
  const [filters, setFilters] = useState({ status: '', staffId: '' })
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadList = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [requestsRes, staffRes] = await Promise.all([
        api.getRequests(filters),
        api.getStaff(),
      ])
      setItems(requestsRes.items || [])
      setStaffItems(staffRes.items || [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Filter context changed, so clear any opened detail panel.
    setSelectedRequest(null)
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.staffId])

  const openDetail = async (id) => {
    // Toggle closed if the same request is clicked again.
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest(null)
      return
    }

    setErrorMessage('')
    try {
      const detail = await api.getRequestById(id)
      setSelectedRequest(detail)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return
    const nextStatus = nextStatusMap[selectedRequest.status]
    if (!nextStatus) return

    setIsUpdatingStatus(true)
    setErrorMessage('')
    try {
      await api.updateRequestStatus(selectedRequest.id, nextStatus)
      const refreshedDetail = await api.getRequestById(selectedRequest.id)
      setSelectedRequest(refreshedDetail)
      await loadList()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const nextStatus = useMemo(
    () => (selectedRequest ? nextStatusMap[selectedRequest.status] : null),
    [selectedRequest]
  )

  return (
    <section>
      <PageTitle title="Requests" subtitle="Filter and view request lifecycle." />
      <ErrorAlert message={errorMessage} />

      <div className="mb-4 grid gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2">
        <select
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="DISPATCHED">DISPATCHED</option>
          <option value="ARRIVED">ARRIVED</option>
          <option value="COLLECTED">COLLECTED</option>
        </select>

        <select
          value={filters.staffId}
          onChange={(event) => setFilters((prev) => ({ ...prev, staffId: event.target.value }))}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Staff</option>
          {staffItems.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name}
            </option>
          ))}
        </select>

      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-3 py-2 font-bold">ID</th>
              <th className="px-3 py-2 font-bold">Staff Name</th>
              <th className="px-3 py-2 font-bold">Store Name</th>
              <th className="px-3 py-2 font-bold">Status</th>
              <th className="px-3 py-2 font-bold">Requested At</th>
              <th className="px-3 py-2 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-3 py-6 text-center text-slate-500">Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-3 py-6 text-center text-slate-500">No requests found.</td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100`}>
                  <td className="px-3 py-2">{item.id}</td>
                  <td className="px-3 py-2">{item.staffName}</td>
                  <td className="px-3 py-2">{item.storeName}</td>
                  <td className="px-3 py-2"><StatusBadge status={item.status} /></td>
                  <td className="px-3 py-2">{formatDate(item.requestedAt)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openDetail(item.id)}
                      className="rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRequest ? (
        <div className="mt-6 rounded-lg bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Request Detail</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>ID: {selectedRequest.id}</p>
            <p>Staff: {selectedRequest.staffName}</p>
            <p>Store: {selectedRequest.storeName}</p>
            <p>Status: <StatusBadge status={selectedRequest.status} /></p>
            <p className="sm:col-span-2">Requested At: {formatDate(selectedRequest.requestedAt)}</p>
            <p className="sm:col-span-2">Note: {selectedRequest.note || '-'}</p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-3 py-2 font-bold">Uniform Item ID</th>
                  <th className="px-3 py-2 font-bold">Item Name</th>
                  <th className="px-3 py-2 font-bold">Size</th>
                  <th className="px-3 py-2 font-bold">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {selectedRequest.items.map((item, index) => (
                  <tr key={`${item.uniformItemId}-${item.size}`} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100`}>
                    <td className="px-3 py-2">{item.uniformItemId}</td>
                    <td className="px-3 py-2">{item.itemName}</td>
                    <td className="px-3 py-2">{item.size}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {nextStatus ? (
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={handleUpdateStatus}
              className="mt-4 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-150 disabled:bg-slate-300 disabled:text-white disabled:cursor-not-allowed px-4 py-2 text-sm font-medium"
            >
              {isUpdatingStatus ? 'Updating...' : `Move to ${nextStatus}`}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}




