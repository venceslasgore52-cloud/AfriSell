import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle, ShieldCheck, Phone } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/useAuth'

export default function VerifyOTP() {
  const { phoneSendOTP, phoneVerifyOTP } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const phone     = location.state?.phone ?? ''

  const [digits, setDigits]   = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent]   = useState(false)
  const refs = useRef([])

  useEffect(() => {
    if (!phone) navigate('/auth/register', { replace: true })
    else refs.current[0]?.focus()
  }, [phone, navigate])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    setError('')
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      refs.current[5]?.focus()
    }
    e.preventDefault()
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const code = digits.join('')
    if (code.length < 6) { setError('Entrez les 6 chiffres du code.'); return }

    setLoading(true)
    setError('')
    try {
      const { created } = await phoneVerifyOTP(phone, code)
      setSuccess(true)
      setTimeout(() => navigate(created ? '/auth/shop-setup' : '/dashboard'), 700)
    } catch (err) {
      setError(err.message || 'Code invalide ou expiré.')
      setDigits(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      await phoneSendOTP(phone)
      setResent(true)
      setDigits(['', '', '', '', '', ''])
      refs.current[0]?.focus()
      setTimeout(() => setResent(false), 5000)
    } catch (err) {
      setError(err.message || 'Impossible de renvoyer le code.')
    } finally {
      setResending(false)
    }
  }

  const filled = digits.filter(Boolean).length

  return (
    <main className="h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">

      <div className="absolute -top-32 -right-32 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-green-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <button
        onClick={() => navigate('/auth/register')}
        className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors cursor-pointer z-10"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="w-full max-w-105 px-4 z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck size={28} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Vérification OTP</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Entrez le code à 6 chiffres envoyé sur WhatsApp au
            </p>
            {phone && (
              <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800 bg-gray-100 px-3 py-1.5 rounded-full">
                <Phone size={13} className="text-green-600" />
                {phone}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => (refs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={loading || success}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all
                    ${d ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-900'}
                    focus:border-green-500 focus:ring-2 focus:ring-green-500/20
                    disabled:opacity-60`}
                />
              ))}
            </div>

            <div className="flex gap-1 mb-6">
              {digits.map((d, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${d ? 'bg-green-500' : 'bg-gray-200'}`} />
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center mb-4">{error}</p>
            )}
            {resent && (
              <p className="text-xs text-green-600 text-center mb-4 font-medium">
                Code renvoyé sur WhatsApp !
              </p>
            )}

            <Button size="md" type="submit" className="w-full justify-center" disabled={loading || success}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {success && <CheckCircle size={16} />}
              {success ? 'Vérifié !' : loading ? 'Vérification...' : `Vérifier le code${filled < 6 ? ` (${filled}/6)` : ''}`}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Code non reçu ?{' '}
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-green-600 font-semibold hover:underline cursor-pointer disabled:opacity-50"
              >
                {resending ? <Loader2 size={12} className="inline animate-spin" /> : 'Renvoyer'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}
