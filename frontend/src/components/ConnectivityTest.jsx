import React, { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function ConnectivityTest() {
  const [isLoading, setIsLoading] = useState(true)
  const [staffCount, setStaffCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const runTest = async () => {
      if (isMounted) {
        setIsLoading(true)
        setErrorMessage('')
      }

      try {
        const response = await api.getStaff()
        const count = Array.isArray(response?.items) ? response.items.length : 0
        if (isMounted) {
          setStaffCount(count)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error?.message || 'Unknown connectivity error.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    runTest()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="mb-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        Testing backend connectivity...
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p className="font-semibold">{`\u274c Connection Failed`}</p>
        <p>{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {`\u2705 Connection Status: Connected to Backend. Found ${staffCount} staff members.`}
    </div>
  )
}
