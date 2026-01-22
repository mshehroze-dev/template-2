import type { ReactNode } from 'react'
import TagPill from './TagPill'

export type PriorityKey = 'high' | 'low' | 'enterprise' | 'trial user' | 'beta user'

export type CardVariant = {
  borderColor: string
  priority: PriorityKey
}

const priorityStyles: Record<PriorityKey, { label: string; textColor: string }> = {
  high: { label: 'High Priority', textColor: '#242424' },
  low: { label: 'Low Priority', textColor: '#242424' },
  enterprise: { label: 'Enterprise', textColor: '#242424' },
  'trial user': { label: 'Trial user', textColor: '#242424' },
  'beta user': { label: 'Beta User', textColor: '#242424' },
}

type FeedbackCardProps = {
  borderColor: string
  priority: PriorityKey
  priorityIcon: ReactNode
}

function FeedbackCard({ borderColor, priority, priorityIcon }: FeedbackCardProps) {
  const priorityInfo = priorityStyles[priority]
  return (
    <div
      className="flex w-full flex-col rounded-[15px] bg-white p-6 shadow-sm"
      style={{ border: `1px solid ${borderColor}` }}
    >
      <div className="flex flex-col gap-4 text-[#242424]">
        <div className="flex items-center justify-between text-base font-bold leading-none">
          <span>Category:</span>
          <span className="text-right text-sm font-light">Dashboard</span>
        </div>
        <div className="flex items-center justify-between text-base font-bold leading-none">
          <span>Status label:</span>
          <span className="text-right text-sm font-light">Live</span>
        </div>
        <div className="flex items-center justify-between text-base font-bold leading-none">
          <span>Priority:</span>
          <div className="flex items-center gap-2 text-sm font-light">
            {priorityIcon}
            <span className="text-right" style={{ color: priorityInfo.textColor }}>
              {priorityInfo.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-center gap-2">
        <TagPill label="Usability Issue" />
        <TagPill label="Performance" />
      </div>
    </div>
  )
}

export default FeedbackCard

