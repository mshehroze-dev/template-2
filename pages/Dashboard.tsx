import FeedbackCard, { type CardVariant } from '../components/FeedbackCard'
import SearchBar from '../components/SearchBar'
import { getPriorityIcon } from '../components/constants'

const cards: CardVariant[] = [
  { borderColor: '#fe4d4d', priority: 'high' },
  { borderColor: '#fe4d4d', priority: 'high' },
  { borderColor: '#15cf74', priority: 'low' },
  { borderColor: '#fbcc31', priority: 'trial user' },
  { borderColor: '#fe4d4d', priority: 'high' },
  { borderColor: '#0e315d', priority: 'enterprise' },
  { borderColor: '#fe4d4d', priority: 'high' },
  { borderColor: '#502cef', priority: 'beta user' },
  { borderColor: '#502cef', priority: 'beta user' },
]

export default function Dashboard() {
  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-[1272px] flex-col gap-6 px-4 pb-16 pt-6 md:gap-10 md:px-4 md:pt-12">
        <SearchBar />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, idx) => (
            <FeedbackCard
              key={`${card.priority}-${idx}`}
              borderColor={card.borderColor}
              priority={card.priority}
              priorityIcon={getPriorityIcon(card.priority)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

