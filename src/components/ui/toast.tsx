import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium animate-in slide-in-from-bottom-2',
        type === 'success'
          ? 'border-empire-gold/40 bg-empire-card text-white'
          : 'border-red-700 bg-empire-card text-red-400',
      )}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastState {
  message: string
  type: 'success' | 'error'
}

export function useToast() {
  const [toast, setToast] = React.useState<ToastState | null>(null)

  const showToast = React.useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type })
    },
    [],
  )

  const hideToast = React.useCallback(() => setToast(null), [])

  return { toast, showToast, hideToast }
}
