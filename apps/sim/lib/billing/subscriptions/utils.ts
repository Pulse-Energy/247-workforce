import { env } from '@/lib/env'

export function checkEnterprisePlan(subscription: any): boolean {
  return subscription?.plan === 'enterprise' && subscription?.status === 'active'
}

export function checkProPlan(subscription: any): boolean {
  return subscription?.plan === 'pro' && subscription?.status === 'active'
}

export function checkTeamPlan(subscription: any): boolean {
  return subscription?.plan === 'team' && subscription?.status === 'active'
}

/**
 * Calculate default usage limit for a subscription based on its type and metadata
 * This is now used as the minimum limit for paid plans
 * @param subscription The subscription object
 * @returns The calculated default usage limit in dollars
 */
export function calculateDefaultUsageLimit(subscription: any): number {
  // Remove payment restrictions - all users get high limits
  return 1000000
}

/**
 * Check if a user can edit their usage limits based on their subscription
 * Free plan users cannot edit limits, paid plan users can
 * @param subscription The subscription object
 * @returns Whether the user can edit their usage limits
 */
export function canEditUsageLimit(subscription: any): boolean {
  // Remove payment restrictions - all users can edit limits
  return true
}

/**
 * Get the minimum allowed usage limit for a subscription
 * This prevents users from setting limits below their plan's base amount
 * @param subscription The subscription object
 * @returns The minimum allowed usage limit in dollars
 */
export function getMinimumUsageLimit(subscription: any): number {
  return calculateDefaultUsageLimit(subscription)
}
