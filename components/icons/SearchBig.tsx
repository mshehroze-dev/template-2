import type { SVGProps } from 'react'

function SearchBig(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      overflow="visible"
      style={{ display: 'block' }}
      viewBox="0 0 16.5278 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M11 11.4722C12.2275 10.3736 13 8.777 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13C8.5367 13 9.9385 12.4223 11 11.4722ZM11 11.4722L15.5278 16"
        stroke="#502CEF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default SearchBig

