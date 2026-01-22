interface AISectionCardProps {
  title: string;
  description: string;
  onClick: () => void;
}

export function AISectionCard({ title, description, onClick }: AISectionCardProps) {
  return (
    <div 
      className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <h3 className="text-lg font-medium text-[#0E315D] mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
      
      <div className="mt-4 flex items-center text-[#502cef]">
        <span className="text-sm font-medium">Try it now</span>
        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

