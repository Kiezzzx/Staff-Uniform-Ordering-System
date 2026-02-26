import React, { useMemo, useState } from 'react'
import AppLayout from './components/AppLayout'
import CreateRequestPage from './pages/CreateRequestPage'
import RequestsPage from './pages/RequestsPage'
import ImportPage from './pages/ImportPage'
import StaffPage from './pages/StaffPage'
import UniformItemsPage from './pages/UniformItemsPage'

const tabs = [
  { key: 'create-request', label: 'Create Request' },
  { key: 'requests', label: 'Requests' },
  { key: 'import-data', label: 'Import Data' },
  { key: 'staff', label: 'Staff' },
  { key: 'uniform-items', label: 'Uniform Items' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('create-request')

  const page = useMemo(() => {
    if (activeTab === 'create-request') {
      return <CreateRequestPage />
    }

    if (activeTab === 'requests') {
      return <RequestsPage />
    }

    if (activeTab === 'import-data') {
      return <ImportPage onGoCreateRequest={() => setActiveTab('create-request')} />
    }

    if (activeTab === 'staff') {
      return <StaffPage />
    }

    return <UniformItemsPage />
  }, [activeTab])

  return (
    <AppLayout tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
      {page}
    </AppLayout>
  )
}
