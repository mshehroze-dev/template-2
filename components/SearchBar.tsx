import { Filter, Salemark, Search } from './icons'

function SearchBar() {
  return (
    <div className="flex w-full max-w-[1272px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Search input and button */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-full border-2 border-[#502cef] bg-white px-4 py-3 md:w-[320px]">
          <Search className="h-5 w-5 shrink-0" />
          <input
            aria-label="Search feedback"
            className="w-full bg-transparent text-sm text-[#0E315D] outline-none placeholder:text-[#7a7a7a]"
            placeholder="Search feedback"
          />
        </div>
        <button className="rounded-full border-2 border-[#502cef] px-6 py-3 text-xs font-bold text-[#502cef] hover:bg-[#efebff] transition-colors whitespace-nowrap">
          Search
        </button>
      </div>

      {/* Filter and Tags buttons */}
      <div className="flex items-center gap-4 text-[#502cef]">
        <button
          aria-label="Filter"
          className="rounded-full p-2 hover:bg-[#efebff] transition-colors"
        >
          <Filter className="h-5 w-5" />
        </button>
        <button
          aria-label="Tags"
          className="rounded-full p-2 hover:bg-[#efebff] transition-colors"
        >
          <Salemark className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default SearchBar

