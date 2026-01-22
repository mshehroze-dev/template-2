import Heart from './icons/Heart'

function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl border-2 border-[#0E315D] flex items-center justify-center">
        <Heart className="h-5 w-5" />
      </div>
      <span className="text-sm font-bold text-[#0E315D]">Collector</span>
    </div>
  )
}

export default LogoMark

