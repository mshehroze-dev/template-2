import { Link, useLocation } from 'react-router-dom'
import { Close } from './icons'
import LogoMark from './LogoMark'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const location = useLocation()
  const links = [
    { label: 'Dashboard', path: '/' },
    { label: 'Feedback', path: '/feedback' },
    { label: 'Roadmap', path: '/roadmap' },
    { label: 'Users', path: '/users' },
    { label: 'Settings', path: '/settings' },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-white/35 backdrop-blur-[12.5px] backdrop-filter"
      onClick={onClose}
    >
      <div className="relative h-full w-full">
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="absolute right-[24px] top-[21px] z-10"
          aria-label="Close menu"
        >
          <Close className="h-[19px] w-[19px]" />
        </button>

        {/* Logo */}
        <div className="absolute left-1/2 top-[14px] -translate-x-1/2">
          <LogoMark />
        </div>

        {/* Navigation items */}
        <div className="absolute left-[37px] top-[78px] flex flex-col gap-6">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className={[
                'flex w-[calc(100vw-74px)] max-w-[387px] items-center gap-3 rounded-xl px-3 py-2 transition-colors',
                isActive(link.path)
                  ? 'bg-white/25'
                  : '',
              ].join(' ')}
            >
              <p className="font-inter text-base font-bold leading-normal text-[#0e315d]">
                {link.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MobileMenu

