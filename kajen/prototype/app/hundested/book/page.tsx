import Image from 'next/image'
import BookingFlow from './BookingFlow'

export default function HundestedBookPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8 flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-charcoal">Book kranløft</h1>
          <p className="text-gray-500 mt-1">HUNDESTED BAADEVÆRFT · Online booking</p>
        </div>
        <div className="hidden md:block relative rounded overflow-hidden flex-shrink-0" style={{ width: '180px', height: '120px' }}>
          <Image
            src="/billeder/bådoptagning2.jpeg"
            alt="Kranløft ved Hundested Baadeværft"
            fill
            className="object-cover object-center"
          />
        </div>
      </div>
      <BookingFlow />
    </div>
  )
}
