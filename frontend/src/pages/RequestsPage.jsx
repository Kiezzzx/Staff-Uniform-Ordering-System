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

const createEmptyEditLine = () => ({ uniformItemId: '', quantity: '' })

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
  const [uniformItems, setUniformItems] = useState([])
  const [filters, setFilters] = useState({ status: '', staffId: '' })
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editLines, setEditLines] = useState([createEmptyEditLine()])
  const [editNote, setEditNote] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeletingRequest, setIsDeletingRequest] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadList = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [requestsRes, staffRes, uniformRes] = await Promise.all([
        api.getRequests(filters),
        api.getStaff(),
        api.getUniformItems(),
      ])
      setItems(requestsRes.items || [])
      setStaffItems(staffRes.items || [])
      setUniformItems(uniformRes.items || [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Filter context changed, so clear any opened detail panel.
    setSelectedRequest(null)
    setIsEditing(false)
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.staffId])

  const openDetail = async (id) => {
    // Toggle closed if the same request is clicked again.
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest(null)
      setIsEditing(false)
      return
    }

    setErrorMessage('')
    try {
      const detail = await api.getRequestById(id)
      setSelectedRequest(detail)
      setIsEditing(false)
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

  const selectedStaff = useMemo(() => {
    if (!selectedRequest) return null
    return (
      staffItems.find(
        (staff) =>
          staff.name === selectedRequest.staffName &&
          staff.storeName === selectedRequest.storeName
      ) || null
    )
  }, [staffItems, selectedRequest])

  const originalQtyByItemId = useMemo(() => {
    if (!selectedRequest?.items) return new Map()
    const map = new Map()
    for (const item of selectedRequest.items) {
      const key = Number(item.uniformItemId)
      map.set(key, (map.get(key) || 0) + Number(item.quantity || 0))
    }
    return map
  }, [selectedRequest])

  const originalTotalQuantity = useMemo(() => {
    if (!selectedRequest?.items) return 0
    return selectedRequest.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }, [selectedRequest])

  const allowanceAvailableForEdit = useMemo(() => {
    if (!selectedStaff) return null
    return Number(selectedStaff.remainingAllowance || 0) + originalTotalQuantity
  }, [selectedStaff, originalTotalQuantity])

  const editLineValidation = useMemo(
    () =>
      editLines.map((line) => {
        const uniformItemId = Number(line.uniformItemId)
        const selectedItem = uniformItems.find((item) => Number(item.id) === uniformItemId)
        const qty = Number(line.quantity)
        const quantityValid = Number.isInteger(qty) && qty > 0
        const originalQty = originalQtyByItemId.get(uniformItemId) || 0
        const availableStock = selectedItem ? Number(selectedItem.stockOnHand) + originalQty : 0
        const stockValid = selectedItem ? qty <= availableStock : false

        return {
          selectedItem,
          quantityValid,
          stockValid,
          availableStock,
        }
      }),
    [editLines, uniformItems, originalQtyByItemId]
  )

  const editedTotalQuantity = useMemo(
    () => editLines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
    [editLines]
  )

  const editHasDuplicateItem = useMemo(() => {
    const seen = new Set()
    for (const line of editLines) {
      const uniformItemId = Number(line.uniformItemId)
      if (!Number.isInteger(uniformItemId) || uniformItemId <= 0) continue
      if (seen.has(uniformItemId)) return true
      seen.add(uniformItemId)
    }
    return false
  }, [editLines])

  const editHasInvalidLine = useMemo(
    () =>
      editLineValidation.some((line, index) => {
        const raw = editLines[index]
        return !line.quantityValid || !raw.uniformItemId || !line.stockValid
      }),
    [editLineValidation, editLines]
  )

  const editExceedsAllowance =
    allowanceAvailableForEdit !== null && editedTotalQuantity > allowanceAvailableForEdit

  const canSaveEdit =
    isEditing &&
    !isSavingEdit &&
    editLines.length > 0 &&
    !editHasInvalidLine &&
    !editHasDuplicateItem &&
    !editExceedsAllowance

  const startEditing = () => {
    if (!selectedRequest || selectedRequest.status !== 'REQUESTED') return
    const nextLines =
      selectedRequest.items?.map((item) => ({
        uniformItemId: String(item.uniformItemId),
        quantity: String(item.quantity),
      })) || []
    setEditLines(nextLines.length > 0 ? nextLines : [createEmptyEditLine()])
    setEditNote(selectedRequest.note || '')
    setIsEditing(true)
    setErrorMessage('')
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditLines([createEmptyEditLine()])
    setEditNote('')
  }

  const handleEditLineChange = (index, field, value) => {
    setEditLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)))
  }

  const addEditLine = () => {
    setEditLines((prev) => [...prev, createEmptyEditLine()])
  }

  const removeEditLine = (index) => {
    setEditLines((prev) => prev.filter((_, i) => i !== index))
  }

  const saveEdit = async () => {
    if (!selectedRequest || !canSaveEdit) return

    setIsSavingEdit(true)
    setErrorMessage('')
    try {
      const payload = {
        items: editLines.map((line) => ({
          uniformItemId: Number(line.uniformItemId),
          quantity: Number(line.quantity),
        })),
        note: editNote.trim() || null,
      }

      const updated = await api.updateRequest(selectedRequest.id, payload)
      setSelectedRequest(updated)
      setIsEditing(false)
      await loadList()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const deleteCurrentRequest = async () => {
    if (!selectedRequest) return
    if (!window.confirm(`Delete request #${selectedRequest.id}? This cannot be undone.`)) {
      return
    }

    setIsDeletingRequest(true)
    setErrorMessage('')
    try {
      await api.deleteRequest(selectedRequest.id)
      setSelectedRequest(null)
      setIsEditing(false)
      await loadList()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsDeletingRequest(false)
    }
  }

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

          {isEditing ? (
            <div className="mt-6 rounded-md border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Edit Request Items</h3>
              <div className="mt-3 space-y-3">
                {editLines.map((line, index) => {
                  const meta = editLineValidation[index]
                  const qty = Number(line.quantity)
                  return (
                    <div key={index} className="rounded-md border border-slate-200 p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Uniform Item</label>
                          <select
                            value={line.uniformItemId}
                            onChange={(event) => handleEditLineChange(index, 'uniformItemId', event.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select item</option>
                            {uniformItems.map((uniformItem) => (
                              <option key={uniformItem.id} value={uniformItem.id}>
                                {uniformItem.itemName} ({uniformItem.size}) - {uniformItem.sku}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={line.quantity}
                            onChange={(event) => handleEditLineChange(index, 'quantity', event.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {meta.selectedItem ? (
                        <p className="mt-2 text-xs text-slate-600">
                          Available for edit: {meta.availableStock}
                        </p>
                      ) : null}

                      {!meta.quantityValid && line.quantity !== '' ? (
                        <p className="mt-2 text-xs text-rose-600">Quantity must be a positive whole number.</p>
                      ) : null}

                      {meta.selectedItem && meta.quantityValid && qty > meta.availableStock ? (
                        <p className="mt-2 text-xs text-rose-600">Requested quantity exceeds available stock.</p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => removeEditLine(index)}
                        disabled={editLines.length === 1}
                        className="mt-2 rounded-md bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-40"
                      >
                        Remove line
                      </button>
                    </div>
                  )
                })}

                <button
                  type="button"
                  onClick={addEditLine}
                  className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                >
                  Add Item
                </button>
              </div>

              <div className="mt-3 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
                Total in Edit: <strong>{editedTotalQuantity}</strong>
                {allowanceAvailableForEdit !== null ? (
                  <span>
                    {' '}
                    vs. Available Allowance for Edit: <strong>{allowanceAvailableForEdit}</strong>
                  </span>
                ) : null}
              </div>

              {editHasDuplicateItem ? (
                <p className="mt-2 text-xs text-rose-600">Duplicate item selected. Each item can appear once.</p>
              ) : null}

              {editExceedsAllowance ? (
                <p className="mt-2 text-xs text-rose-600">Request exceeds available allowance for edit.</p>
              ) : null}

              <div className="mt-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">Note (Optional)</label>
                <textarea
                  value={editNote}
                  onChange={(event) => setEditNote(event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={!canSaveEdit}
                  onClick={saveEdit}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Edit'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingRequest}
                  onClick={deleteCurrentRequest}
                  className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:bg-slate-300"
                >
                  {isDeletingRequest ? 'Deleting...' : 'Delete Request'}
                </button>
              </div>
            </div>
          ) : null}

          {!isEditing && selectedRequest.status === 'REQUESTED' ? (
            <button
              type="button"
              onClick={startEditing}
              className="mt-4 rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
            >
              Edit
            </button>
          ) : null}

          {!isEditing && nextStatus ? (
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




