import { Link, useLocation } from 'react-router-dom'

function Navigation() {
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

  return (
    <div className="flex items-center gap-3 rounded-[35px] border border-[#502cef] bg-white px-2 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        {links.map((link) => (
          <Link
            key={link.label}
            to={link.path}
            className={[
              'rounded-[20px] px-4 py-[10px] text-sm font-bold transition-colors',
              isActive(link.path)
                ? 'bg-[#502cef] text-white'
                : 'text-[#0E315D] hover:bg-[#efebff]',
            ].join(' ')}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <a
        href="#"
        className="rounded-[25px] bg-[#502cef] px-8 py-3 text-xs font-bold text-white shadow-sm"
      >
        Add New Idea
      </a>
    </div>
  )
}

export default Navigation

