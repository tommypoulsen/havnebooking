import BookingFlow from './BookingFlow'

export default async function BookPage(props: PageProps<'/book'>) {
  const { service } = await props.searchParams
  const initialService = typeof service === 'string' ? service : undefined

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy">Book ydelse</h1>
        <p className="text-gray-500 mt-1">Hundested Bådeværft · Online booking</p>
      </div>
      <BookingFlow initialService={initialService} />
    </div>
  )
}
