import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined) {
  // Safely handle null, undefined, or NaN values
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0

  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount)
}

/**
 * Returns a Tailwind text color class based on days overdue.
 * 0 = green, 1-30 = light yellow, 31-60 = amber, 61-90 = orange, 90+ = red
 */
export function getArrearsTextColor(days: number): string {
  if (days === 0) return 'text-green-600'
  if (days <= 30) return 'text-amber-600'
  if (days <= 60) return 'text-amber-500'
  if (days <= 90) return 'text-orange-500'
  return 'text-red-600'
}

/**
 * Returns a hex color based on days overdue (for use in inline styles / charts).
 * 0 = green, 1-30 = light yellow, 31-60 = amber, 61-90 = orange, 90+ = red
 */
export function getArrearsHexColor(days: number): string {
  if (days === 0) return '#22c55e'
  if (days <= 30) return '#d97706'
  if (days <= 60) return '#f59e0b'
  if (days <= 90) return '#f97316'
  return '#ef4444'
}
