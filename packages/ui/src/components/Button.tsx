import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-opacity-75',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl focus:ring-blue-600/50',
        secondary: 'bg-green-600 text-white hover:bg-green-700 shadow-lg focus:ring-green-600/50',
        success: 'bg-green-600 text-white hover:bg-green-700 shadow-lg focus:ring-green-600/50',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg focus:ring-red-600/50',
        ghost: 'bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:ring-blue-600/50',
        outline: 'border-2 border-gray-300 hover:bg-gray-50 focus:ring-gray-300/50',
        gradient: 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-xl focus:ring-cyan-200',
        custom: ''
      },
      size: {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3',
        xl: 'text-xl px-8 py-4'
      },
      fullWidth: {
        true: 'w-full',
        false: ''
      },
      touchOptimized: {
        true: 'min-h-[48px] sm:min-h-[56px]',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      touchOptimized: false
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, touchOptimized, loading, loadingText = 'Cargando...', children, disabled, ...props }, ref) => {
    if (variant === 'custom' && className) {
      return (
        <button
          className={className}
          disabled={disabled || loading}
          ref={ref}
          {...props}
        >
          {loading ? loadingText : children}
        </button>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, touchOptimized, className }))}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {loading && !loadingText ? children : loading ? loadingText : children}
      </button>
    )
  }
)

Button.displayName = 'Button'