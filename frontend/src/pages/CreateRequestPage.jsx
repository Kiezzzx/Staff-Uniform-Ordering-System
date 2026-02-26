import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import PageTitle from '../components/PageTitle'
import ErrorAlert from '../components/ErrorAlert'

const createEmptyLine = () => ({ uniformItemId: '', quantity: '' })

export default function CreateRequestPage() {
  const [staffItems, setStaffItems] = useState([])
  const [uniformItems, setUniformItems] = useState([])
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [lines, setLines] = useState([createEmptyLine()])
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const [staffRes, uniformRes] = await Promise.all([api.getStaff(), api.getUniformItems()])
        setStaffItems(staffRes.items || [])
        setUniformItems(uniformRes.items || [])
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const selectedStaff = useMemo(
    () => staffItems.find((s) => String(s.id) === String(selectedStaffId)),
    [staffItems, selectedStaffId]
  )

  const totalCartQuantity = useMemo(
    () => lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
    [lines]
  )

  const lineValidation = useMemo(
    () =>
      lines.map((line) => {
        const selectedItem = uniformItems.find((item) => String(item.id) === String(line.uniformItemId))
        const qty = Number(line.quantity)

        return {
          selectedItem,
          quantityValid: Number.isInteger(qty) && qty > 0,
          stockValid: selectedItem ? qty <= Number(selectedItem.stockOnHand) : false,
        }
      }),
    [lines, uniformItems]
  )

  const cartExceedsAllowance =
    selectedStaff && Number(totalCartQuantity) > Number(selectedStaff.remainingAllowance || 0)

  const hasInvalidLine = lineValidation.some(
    (line, index) => !line.quantityValid || !lines[index].uniformItemId || !line.stockValid
  )

  const canSubmit =
    !!selectedStaffId &&
    lines.length > 0 &&
    !cartExceedsAllowance &&
    !hasInvalidLine &&
    !isSubmitting

  const handleLineChange = (index, field, value) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)))
  }

  const addLine = () => setLines((prev) => [...prev, createEmptyLine()])
  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessData(null)

    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      const payload = {
        staffId: Number(selectedStaffId),
        note: note.trim() || null,
        items: lines.map((line) => ({
          uniformItemId: Number(line.uniformItemId),
          quantity: Number(line.quantity),
        })),
      }

      const created = await api.createRequest(payload)
      setSuccessData(created)

      const [staffRes, uniformRes] = await Promise.all([api.getStaff(), api.getUniformItems()])
      setStaffItems(staffRes.items || [])
      setUniformItems(uniformRes.items || [])

      setLines([createEmptyLine()])
      setSelectedStaffId('')
      setNote('')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading...</p>
  }

  return (
    <section className="mx-auto max-w-5xl">
      <PageTitle title="Create Request" subtitle="Create a uniform request with live allowance and stock context." />

      <ErrorAlert message={errorMessage} />

      {successData ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Request created: #{successData.id} ({successData.status})
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-8 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Staff Member</label>
          <select
            value={selectedStaffId}
            onChange={(event) => setSelectedStaffId(event.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select staff</option>
            {staffItems.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} ({staff.role})
              </option>
            ))}
          </select>
          {selectedStaff ? (
            <p className="mt-2 text-sm text-slate-600">
              Remaining Allowance: <strong>{selectedStaff.remainingAllowance}</strong>
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          {lines.map((line, index) => {
            const meta = lineValidation[index]
            const item = meta.selectedItem
            const qty = Number(line.quantity)

            return (
              <div key={index} className="rounded-md border border-slate-200 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Uniform Item</label>
                    <select
                      value={line.uniformItemId}
                      onChange={(event) => handleLineChange(index, 'uniformItemId', event.target.value)}
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
                      onChange={(event) => handleLineChange(index, 'quantity', event.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {item ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                    <span>In Stock: {item.stockOnHand}</span>
                    {item.isLowStock ? (
                      <span className="rounded-full border border-amber-300 bg-amber-200 px-2 py-1 font-semibold text-amber-900">
                        Low Stock
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {!meta.quantityValid && line.quantity !== '' ? (
                  <p className="mt-2 text-xs text-rose-600">Quantity must be a positive whole number.</p>
                ) : null}

                {item && meta.quantityValid && qty > Number(item.stockOnHand) ? (
                  <p className="mt-2 text-xs text-rose-600">Requested quantity exceeds available stock.</p>
                ) : null}

                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                  className="mt-2 rounded-md bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-40"
                >
                  Remove line
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={addLine}
            className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            Add Item
          </button>
        </div>

        <div className="rounded-md bg-indigo-50 text-indigo-700 font-medium px-4 py-2 text-sm">
          Total in Cart: <strong>{totalCartQuantity}</strong>
          {selectedStaff ? (
            <span>
              {' '}
              vs. Remaining Allowance: <strong>{selectedStaff.remainingAllowance}</strong>
            </span>
          ) : null}
        </div>

        {cartExceedsAllowance ? (
          <p className="text-sm text-rose-600">Request exceeds remaining allowance.</p>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Add a note for this request..."
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {!canSubmit ? (
          <p className="text-sm text-rose-600">*Please fill in all the required fields.</p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-150 disabled:bg-slate-300 disabled:text-white disabled:cursor-not-allowed px-4 py-2 text-sm font-medium"
        >
          {isSubmitting ? 'Creating...' : 'Create Request'}
        </button>
      </form>
    </section>
  )
}





