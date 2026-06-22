import { ComponentProps } from 'react'

export default function InputError({
    message,
    className,
    ...props
}: {
    message?: string
    className?: string
} & ComponentProps<'p'>): JSX.Element | null
