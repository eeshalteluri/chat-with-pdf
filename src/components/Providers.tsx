'use client'
import { ReactNode } from 'react'
import {QueryClientProvider, QueryClient} from '@tanstack/react-query'

type Props = {
    children: ReactNode
}

const queryClient = new QueryClient()

const Providers = ({children}: Props) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

export default Providers