import AdminPanel from './AdminPanel'

export default function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">

      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-charcoal">Administration</h1>
          <p className="text-gray-500 mt-1">HUNDESTED BAADEVÆRFT · Intern oversigt</p>
        </div>
        <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 shrink-0">
          <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L16.5 15H1.5L9 2Z" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 7v4" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="9" cy="12.5" r="0.75" fill="#b45309"/>
          </svg>
          <p className="text-xs text-yellow-700 font-medium">Intern · ikke synlig for kunder</p>
        </div>
      </div>
      <AdminPanel />
    </div>
  )
}
