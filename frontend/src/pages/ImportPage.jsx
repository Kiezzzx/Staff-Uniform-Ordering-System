import React, { useState } from 'react'
import { api } from '../api/client'
import PageTitle from '../components/PageTitle'
import ErrorAlert from '../components/ErrorAlert'

export default function ImportPage({ onGoCreateRequest }) {
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [summary, setSummary] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const csvValidationMessage = 'Please select a CSV file.'

  const isCsvFile = (selectedFile) => {
    if (!selectedFile?.name) return false
    return selectedFile.name.toLowerCase().endsWith('.csv')
  }

  const handleFileSelection = (selectedFile) => {
    if (!selectedFile || !isCsvFile(selectedFile)) {
      setFile(null)
      setErrorMessage(csvValidationMessage)
      return
    }

    setErrorMessage('')
    setFile(selectedFile)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)

    const droppedFile = event.dataTransfer?.files?.[0] || null
    handleFileSelection(droppedFile)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) {
      setErrorMessage(csvValidationMessage)
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)
    setSummary(null)

    try {
      const created = await api.importCsv(file)
      const result = await api.getImportSummary(created.importJobId)
      setSummary(result)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <PageTitle title="Import Data" subtitle="Upload CSV and review import results." />

      <ErrorAlert message={errorMessage} />

      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-8 shadow-sm">
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Importing item CSV updates current stock levels (inventory sync behavior).
        </p>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-4 rounded-md border-2 border-dashed px-4 py-6 text-center text-sm ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-slate-300 bg-slate-50 text-slate-600'
          }`}
        >
          Drag and drop a CSV file here
          {file ? <p className="mt-2 font-medium text-slate-800">Selected: {file.name}</p> : null}
        </div>

        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="csvFile">
          CSV File
        </label>
        <input
          id="csvFile"
          type="file"
          accept=".csv"
          onChange={(event) => handleFileSelection(event.target.files?.[0] || null)}
          className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {!errorMessage && file ? (
          <p className="mt-2 text-sm text-slate-600">Selected file: {file.name}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !file}
          className="mt-4 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-150 disabled:bg-slate-300 disabled:text-white disabled:cursor-not-allowed px-4 py-2 text-sm font-medium"
        >
          {isSubmitting ? 'Importing...' : 'Import CSV'}
        </button>
      </form>

      {summary ? (
        <div className="mt-6 rounded-lg bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Import Summary</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
            <p>Total Rows: {summary.totalRows}</p>
            <p>Valid Rows: {summary.validRows}</p>
            <p>Invalid Rows: {summary.invalidRows}</p>
          </div>

          {summary.invalidRows > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="px-3 py-2 font-bold">Row Number</th>
                    <th className="px-3 py-2 font-bold">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.errors.map((err, index) => (
                    <tr key={`${err.rowNumber}-${err.message}`} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100`}>
                      <td className="px-3 py-2">{err.rowNumber}</td>
                      <td className="px-3 py-2">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onGoCreateRequest}
            className="mt-4 rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            Go to Create Request
          </button>
        </div>
      ) : null}
    </section>
  )
}


