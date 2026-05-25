
const variants = {
  primary: 'bg-green-600 text-white shadow-[0_4px_14px_rgba(22,163,74,0.3)] hover:bg-green-700 hover:-translate-y-0.5',
  secondary: 'bg-white text-gray-900 border border-gray-200 shadow-sm hover:border-green-600 hover:text-green-600 hover:-translate-y-0.5',
  white: 'bg-white text-green-600 shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:-translate-y-0.5',
  ghost: 'border-2 border-white/50 text-white hover:bg-white/10',
}

export default function PrimaryButton({ children, variant, outline = false, size = 'md', onClick, className = '' }) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer'
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' }
  const resolvedVariant = variant ?? (outline ? 'secondary' : 'primary')

  return (
    <button onClick={onClick} className={`${base} ${sizes[size]} ${variants[resolvedVariant]} ${className}`}>
      {children}
    </button>
  )
}
