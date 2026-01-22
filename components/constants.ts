import type { ReactNode } from 'react'
import type { PriorityKey } from './FeedbackCard'
import {
  ArrowDownBlue,
  ArrowDownGreen,
  ArrowDownIndigo,
  ArrowDownSalmon,
  ArrowDownYellow,
} from './icons'
import { createElement } from 'react'

export const getPriorityIcon = (priority: PriorityKey): ReactNode => {
  const iconMap = {
    high: ArrowDownSalmon,
    low: ArrowDownGreen,
    enterprise: ArrowDownBlue,
    'trial user': ArrowDownYellow,
    'beta user': ArrowDownIndigo,
  }
  const IconComponent = iconMap[priority]
  return createElement(IconComponent, { className: 'h-5 w-5' })
}

