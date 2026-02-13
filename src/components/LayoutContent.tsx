'use client'

import { usePathname } from 'next/navigation'
import { useMemo, memo } from 'react'
import { Sidebar } from './organisms/Sidebar'
import { useAuthStore } from '@/store/authStore'

const AUTHENTICATED_ROUTES = [
  '/dashboard',
  '/activities',
  '/entities',
  '/transactions',
  '/transactions',
  '/surety_bond',
  '/fee-reconciliation',
  '/reports',
  '/admin',
  '/owner-registry',
  '/management-firms',
  '/asset-registry',
  '/budgets',
  '/help',
]

interface LayoutContentProps {
  children: React.ReactNode
}

const LayoutContentComponent = ({ children }: LayoutContentProps) => {
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const shouldShowSidebar = useMemo(() => {
    // Never show sidebar on login page
    if (pathname === '/login') {
      return false
    }

    // Don't show sidebar if not authenticated, even on protected routes
    if (!isAuthenticated) {
      return false
    }

    const isValidRoute = AUTHENTICATED_ROUTES.some((route) => {
      if (route === '/dashboard') {
        return pathname === '/dashboard'
      }
      if (route === '/activities') {
        return (
          pathname === '/activities/pending' ||
          pathname === '/activities/involved' ||
          pathname?.startsWith('/activities/')
        )
      }
      if (route === '/entities') {
        return (
          pathname === '/asset-registry' ||
          pathname === '/management-firms' ||
          pathname === '/owner-registry' ||
          pathname?.startsWith('/asset-registry/') ||
          pathname?.startsWith('/management-firms/') ||
          pathname?.startsWith('/owner-registry/')
        )
      }
      if (route === '/transactions') {
        return (
          pathname === '/transactions/unallocated' ||
          pathname === '/transactions/discarded' ||
          pathname === '/transactions/allocated' ||
          pathname?.startsWith('/transactions/')
        )
      }
      if (route === '/transactions') {
        return (
          pathname === '/transactions/manual' ||
          pathname === '/transactions/tas' ||
          pathname?.startsWith('/transactions/')
        )
      }
      if (route === '/surety_bond') {
        return (
          pathname === '/surety_bond' ||
          pathname === '/surety_bond/new' ||
          pathname?.startsWith('/surety_bond/new/')
        )
      }
      if (route === '/fee-reconciliation') {
        return pathname === '/fee-reconciliation'
      }
      if (route === '/reports') {
        return (
          pathname === '/reports/business' || pathname?.startsWith('/reports/')
        )
      }
      if (route === '/admin') {
        return (
          pathname === '/admin/bank-management' ||
          pathname === '/admin/stakeholder' ||
          pathname === '/admin/entitlement' ||
          pathname === '/admin/access-grant' ||
          pathname === '/admin/security' ||
          pathname?.startsWith('/admin/')
        )
      }
      if (route === '/asset-registry') {
        return (
          pathname === '/asset-registry' ||
          pathname?.startsWith('/asset-registry/')
        )
      }
      if (route === '/management-firms') {
        return (
          pathname === '/management-firms' ||
          pathname?.startsWith('/management-firms/')
        )
      }
      if (route === '/owner-registry') {
        return (
          pathname === '/owner-registry' ||
          pathname?.startsWith('/owner-registry/')
        )
      }
      if (route === '/budgets') {
        return (
          pathname === '/budgets' ||
          pathname?.startsWith('/budgets/')
        )
      }
      if (route === '/help') {
        return pathname === '/help'
      }
      return pathname?.startsWith(route)
    })

    return isValidRoute
  }, [pathname, isAuthenticated])

  if (shouldShowSidebar) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">{children}</div>
      </div>
    )
  }

  return <>{children}</>
}

export const LayoutContent = memo(LayoutContentComponent)
LayoutContent.displayName = 'LayoutContent'
