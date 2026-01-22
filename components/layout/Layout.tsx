import Header from '../Header'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="font-inter bg-white min-h-screen text-[#0E315D]">
      
      <main>{children}</main>
    </div>
  )
}
