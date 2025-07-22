import { and, eq } from 'drizzle-orm'
import { getPlanPricing } from '@/lib/billing/core/billing'
import { getHighestPrioritySubscription } from '@/lib/billing/core/subscription'
import { createLogger } from '@/lib/logs/console-logger'
import { db } from '@/db'
import { member, organization, user, userStats } from '@/db/schema'

const logger = createLogger('OrganizationBilling')

interface OrganizationUsageData {
  organizationId: string
  organizationName: string
  subscriptionPlan: string
  subscriptionStatus: string
  totalSeats: number
  usedSeats: number
  totalCurrentUsage: number
  totalUsageLimit: number
  averageUsagePerMember: number
  billingPeriodStart: Date | null
  billingPeriodEnd: Date | null
  members: MemberUsageData[]
}

interface MemberUsageData {
  userId: string
  userName: string
  userEmail: string
  currentUsage: number
  usageLimit: number
  percentUsed: number
  isOverLimit: boolean
  role: string
  joinedAt: Date
  lastActive: Date | null
}

/**
 * Get comprehensive organization billing and usage data
 */
export async function getOrganizationBillingData(
  organizationId: string
): Promise<OrganizationUsageData | null> {
  try {
    // Get organization info
    const orgRecord = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1)

    if (orgRecord.length === 0) {
      logger.warn('Organization not found', { organizationId })
      return null
    }

    const organizationData = orgRecord[0]

    // Get organization subscription
    const subscription = await getHighestPrioritySubscription(organizationId)

    if (!subscription) {
      logger.warn('No subscription found for organization', { organizationId })
      return null
    }

    // Get all organization members with their usage data
    const membersWithUsage = await db
      .select({
        userId: member.userId,
        userName: user.name,
        userEmail: user.email,
        role: member.role,
        joinedAt: member.createdAt,
        // User stats fields
        currentPeriodCost: userStats.currentPeriodCost,
        currentUsageLimit: userStats.currentUsageLimit,
        billingPeriodStart: userStats.billingPeriodStart,
        billingPeriodEnd: userStats.billingPeriodEnd,
        lastActive: userStats.lastActive,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .leftJoin(userStats, eq(member.userId, userStats.userId))
      .where(eq(member.organizationId, organizationId))

    // Process member data
    const members: MemberUsageData[] = membersWithUsage.map((memberRecord) => {
      const currentUsage = Number(memberRecord.currentPeriodCost || 0)
      const usageLimit = Number(memberRecord.currentUsageLimit || 5)
      const percentUsed = usageLimit > 0 ? (currentUsage / usageLimit) * 100 : 0

      return {
        userId: memberRecord.userId,
        userName: memberRecord.userName,
        userEmail: memberRecord.userEmail,
        currentUsage,
        usageLimit,
        percentUsed: Math.round(percentUsed * 100) / 100,
        isOverLimit: currentUsage > usageLimit,
        role: memberRecord.role,
        joinedAt: memberRecord.joinedAt,
        lastActive: memberRecord.lastActive,
      }
    })

    // Calculate aggregated statistics
    const totalCurrentUsage = members.reduce((sum, member) => sum + member.currentUsage, 0)

    // Get per-seat pricing for the plan
    const { basePrice: pricePerSeat } = getPlanPricing(subscription.plan, subscription)
    const licensedSeats = subscription.seats || members.length

    // Validate seat capacity - warn if members exceed licensed seats
    if (subscription.seats && members.length > subscription.seats) {
      logger.warn('Organization has more members than licensed seats', {
        organizationId,
        licensedSeats: subscription.seats,
        actualMembers: members.length,
        plan: subscription.plan,
      })
    }

    // Billing is based on licensed seats, not actual member count
    // This ensures organizations pay for their seat capacity regardless of utilization
    const seatsCount = licensedSeats
    const minimumBillingAmount = seatsCount * pricePerSeat

    // Total usage limit represents the minimum amount the team will be billed
    // This is based on licensed seats, not individual member limits (which are personal controls)
    const totalUsageLimit = minimumBillingAmount

    const averageUsagePerMember = members.length > 0 ? totalCurrentUsage / members.length : 0

    // Get billing period from first member (should be consistent across org)
    const firstMember = membersWithUsage[0]
    const billingPeriodStart = firstMember?.billingPeriodStart || null
    const billingPeriodEnd = firstMember?.billingPeriodEnd || null

    return {
      organizationId,
      organizationName: organizationData.name,
      subscriptionPlan: subscription.plan,
      subscriptionStatus: subscription.status || 'active',
      totalSeats: subscription.seats || 1,
      usedSeats: members.length,
      totalCurrentUsage: Math.round(totalCurrentUsage * 100) / 100,
      totalUsageLimit: Math.round(totalUsageLimit * 100) / 100,
      averageUsagePerMember: Math.round(averageUsagePerMember * 100) / 100,
      billingPeriodStart,
      billingPeriodEnd,
      members: members.sort((a, b) => b.currentUsage - a.currentUsage), // Sort by usage desc
    }
  } catch (error) {
    logger.error('Failed to get organization billing data', { organizationId, error })
    throw error
  }
}

/**
 * Update usage limit for a specific organization member
 */
export async function updateMemberUsageLimit(
  organizationId: string,
  memberId: string,
  newLimit: number,
  adminUserId: string
): Promise<void> {
  // Remove payment restrictions - all users can edit limits
  if (newLimit < 1) {
    throw new Error('Usage limit cannot be below $1')
  }

  // Update the usage limit
  await db
    .update(userStats)
    .set({
      currentUsageLimit: newLimit.toString(),
      usageLimitSetBy: adminUserId,
      usageLimitUpdatedAt: new Date(),
    })
    .where(eq(userStats.userId, memberId))
}

/**
 * Get organization billing summary for admin dashboard
 */
export async function getOrganizationBillingSummary(organizationId: string) {
  try {
    const billingData = await getOrganizationBillingData(organizationId)

    if (!billingData) {
      return null
    }

    // Calculate additional metrics
    const membersOverLimit = billingData.members.filter((m) => m.isOverLimit).length
    const membersNearLimit = billingData.members.filter(
      (m) => !m.isOverLimit && m.percentUsed >= 80
    ).length

    const topUsers = billingData.members.slice(0, 5).map((m) => ({
      name: m.userName,
      usage: m.currentUsage,
      limit: m.usageLimit,
      percentUsed: m.percentUsed,
    }))

    return {
      organization: {
        id: billingData.organizationId,
        name: billingData.organizationName,
        plan: billingData.subscriptionPlan,
        status: billingData.subscriptionStatus,
      },
      usage: {
        total: billingData.totalCurrentUsage,
        limit: billingData.totalUsageLimit,
        average: billingData.averageUsagePerMember,
        percentUsed:
          billingData.totalUsageLimit > 0
            ? (billingData.totalCurrentUsage / billingData.totalUsageLimit) * 100
            : 0,
      },
      seats: {
        total: billingData.totalSeats,
        used: billingData.usedSeats,
        available: billingData.totalSeats - billingData.usedSeats,
      },
      alerts: {
        membersOverLimit,
        membersNearLimit,
      },
      billingPeriod: {
        start: billingData.billingPeriodStart,
        end: billingData.billingPeriodEnd,
      },
      topUsers,
    }
  } catch (error) {
    logger.error('Failed to get organization billing summary', { organizationId, error })
    throw error
  }
}
