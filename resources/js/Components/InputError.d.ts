import { JSX } from 'react'

interface InputErrorProps {
    message?: string
    className?: string
    [key: string]: unknown
}

export default function InputError(props: InputErrorProps): JSX.Element | null
