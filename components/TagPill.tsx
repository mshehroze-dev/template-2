type TagPillProps = {
  label: string
}

function TagPill({ label }: TagPillProps) {
  return (
    <button className="rounded-full border border-[#0E315D] px-4 py-[6px] text-xs font-light text-[#242424]">
      {label}
    </button>
  )
}

export default TagPill

