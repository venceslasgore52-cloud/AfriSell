export default function Cadre({ badge, title, sub, center = true }) {
  return (
    <div className={center ? 'text-center' : ''}>
      {badge && (
        <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200 mb-4 uppercase tracking-wide">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">{title}</h2>
      {sub && <p className="text-gray-500 text-lg max-w-2xl mx-auto">{sub}</p>}
    </div>
  )
}
