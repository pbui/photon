import { writable } from 'svelte/store'

type ToastType = keyof typeof toastColors

export const toastColors = {
  error: 'bg-red-500 text-white border border-red-600',
  warning: 'bg-yellow-400 text-black border border-yellow-500',
  success: 'bg-green-400 text-black border border-green-500',
  info: 'dark:bg-zinc-900 bg-white border border-slate-200 dark:border-zinc-800 shadow-lg',
}

export interface Toast {
  id: number
  title?: string
  content: string
  type: ToastType
  action?: () => any
}

export const toasts = writable<Toast[]>([])

export function toast({
  title,
  content,
  type = 'info',
  duration = 5000,
  action,
}: {
  title?: string
  content: string
  type?: ToastType
  duration?: number
  action?: () => any
}) {
  let id = 0

  toasts.update((toasts) => {
    id = Math.floor(Math.random() * 10000)

    return [
      ...toasts,
      {
        id: id,
        content: content,
        title: title,
        type: type,
        action: action,
      },
    ]
  })

  setTimeout(() => {
    toasts.update((toasts) => toasts.filter((toast) => toast.id != id))
  }, duration)
}
