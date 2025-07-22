import { and, eq, inArray } from 'drizzle-orm'
import { client } from '@/lib/auth-client'
import {
  calculateDefaultUsageLimit,
  checkEnterprisePlan,
  checkProPlan,
  checkTeamPlan,
} from '@/lib/billing/subscriptions/utils'
import type { UserSubscriptionState } from '@/lib/billing/types'
import { isProd } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console-logger'
import { db } from '@/db'
import { member, subscription, userStats } from '@/db/schema'

const logger = createLogger('SubscriptionCore')

/**
 * Core subscription management - single source of truth
 * Consolidates logic from both lib/subscription.ts and lib/subscription/subscription.ts
 */

/**
 * Get the highest priority active subscription for a user
 * Priority: Enterprise > Team > Pro > Free
 */
export async function getHighestPrioritySubscription(userId: string) {
  try {
    // Get direct subscriptions
    const personalSubs = await db
      .select()
      .from(subscription)
      .where(and(eq(subscription.referenceId, userId), eq(subscription.status, 'active')))

    // Get organization memberships
    const memberships = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, userId))

    const orgIds = memberships.map((m: { organizationId: string }) => m.organizationId)

    // Get organization subscriptions
    let orgSubs: any[] = []
    if (orgIds.length > 0) {
      orgSubs = await db
        .select()
        .from(subscription)
        .where(and(inArray(subscription.referenceId, orgIds), eq(subscription.status, 'active')))
    }

    const allSubs = [...personalSubs, ...orgSubs]

    if (allSubs.length === 0) return null

    // Return highest priority subscription
    const enterpriseSub = allSubs.find((s) => checkEnterprisePlan(s))
    if (enterpriseSub) return enterpriseSub

    const teamSub = allSubs.find((s) => checkTeamPlan(s))
    if (teamSub) return teamSub

    const proSub = allSubs.find((s) => checkProPlan(s))
    if (proSub) return proSub

    return null
  } catch (error) {
    logger.error('Error getting highest priority subscription', { error, userId })
    return null
  }
}

/**
 * Check if user is on Pro plan (direct or via organization)
 */
export async function isProPlan(userId: string): Promise<boolean> {
  // Remove payment restrictions - all users have pro access
  return true
}

/**
 * Check if user is on Team plan (direct or via organization)
 */
export async function isTeamPlan(userId: string): Promise<boolean> {
  try {
    if (!isProd) {
      return true
    }

    const subscription = await getHighestPrioritySubscription(userId)
    const isTeam =
      subscription && (checkTeamPlan(subscription) || checkEnterprisePlan(subscription))

    if (isTeam) {
      logger.info('User has team-level plan', { userId, plan: subscription.plan })
    }

    return !!isTeam
  } catch (error) {
    logger.error('Error checking team plan status', { error, userId })
    return false
  }
}

/**
 * Check if user is on Enterprise plan (direct or via organization)
 */
export async function isEnterprisePlan(userId: string): Promise<boolean> {
  try {
    if (!isProd) {
      return true
    }

    const subscription = await getHighestPrioritySubscription(userId)
    const isEnterprise = subscription && checkEnterprisePlan(subscription)

    if (isEnterprise) {
      logger.info('User has enterprise plan', { userId, plan: subscription.plan })
    }

    return !!isEnterprise
  } catch (error) {
    logger.error('Error checking enterprise plan status', { error, userId })
    return false
  }
}

/**
 * Check if user has exceeded their cost limit based on current period usage
 */
export async function hasExceededCostLimit(userId: string): Promise<boolean> {
  // Remove usage restrictions - users can always use the service
  return false
}

/**
 * Check if sharing features are enabled for user
 */
export async function isSharingEnabled(userId: string): Promise<boolean> {
  // Remove payment restrictions - all users can share
  return true
}

/**
 * Check if multiplayer features are enabled for user
 */
export async function isMultiplayerEnabled(userId: string): Promise<boolean> {
  // Remove payment restrictions - all users can use multiplayer
  return true
}

/**
 * Check if workspace collaboration features are enabled for user
 */
export async function isWorkspaceCollaborationEnabled(userId: string): Promise<boolean> {
  // Remove payment restrictions - all users can collaborate
  return true
}

/**
 * Get comprehensive subscription state for a user
 * Single function to get all subscription information
 */
export async function getUserSubscriptionState(userId: string): Promise<UserSubscriptionState> {
  // Remove payment restrictions - all users get pro-level access
  return {
    isPro: true,
    isTeam: true,
    isEnterprise: true,
    isFree: false,
    highestPrioritySubscription: null,
    features: {
      sharingEnabled: true,
      multiplayerEnabled: true,
      workspaceCollaborationEnabled: true,
    },
    hasExceededLimit: false,
    planName: 'pro',
  }
}
