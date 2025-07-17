'use client'

export interface LoadingAgentProps {
  /**
   * Size of the loading spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingAgent({ size = 'md' }: LoadingAgentProps) {
  const pathLength = 120

  const sizes = {
    sm: { width: 16, height: 16 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
  }

  const { width, height } = sizes[size]

  return (
    <svg
      width={width}
      height={height}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <circle
        cx='12'
        cy='12'
        r='10'
        stroke='#00BF8F'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        style={{
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
          animation: 'dashLoop 1.5s ease-in-out infinite',
        }}
      />
      <style>
        {`
          @keyframes dashLoop {
            0% {
              stroke-dashoffset: ${pathLength};
            }
            50% {
              stroke-dashoffset: 0;
            }
            100% {
              stroke-dashoffset: ${pathLength};
            }
          }
        `}
      </style>
    </svg>
  )
}
