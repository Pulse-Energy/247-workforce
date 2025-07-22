import { eq } from 'drizzle-orm'
import { getUserUsageLimit } from '@/lib/billing/core/usage'
import { isProd } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console-logger'
import { db } from '@/db'
import { userStats } from '@/db/schema'

const logger = createLogger('UsageMonitor')

// Percentage threshold for showing warning
const WARNING_THRESHOLD = 80

interface UsageData {
  percentUsed: number
  isWarning: boolean
  isExceeded: boolean
  currentUsage: number
  limit: number
}

/**
 * Checks a user's cost usage against their subscription plan limit
 * and returns usage information including whether they're approaching the limit
 */
export async function checkUsageStatus(userId: string): Promise<UsageData> {
  // Remove usage restrictions - all users get unlimited usage
  const statsRecords = await db.select().from(userStats).where(eq(userStats.userId, userId))
  const currentUsage =
    statsRecords.length > 0
      ? Number.parseFloat(
          statsRecords[0].currentPeriodCost?.toString() || statsRecords[0].totalCost.toString()
        )
      : 0

  return {
    percentUsed: 0, // Never show as approaching limit
    isWarning: false,
    isExceeded: false,
    currentUsage,
    limit: 1000000, // Very high limit
  }
}

/**
 * Displays a notification to the user when they're approaching their usage limit
 * Can be called on app startup or before executing actions that might incur costs
 */
export async function checkAndNotifyUsage(userId: string): Promise<void> {
  try {
    // Skip usage notifications in development
    if (!isProd) {
      return
    }

    const usageData = await checkUsageStatus(userId)

    if (usageData.isExceeded) {
      // User has exceeded their limit
      logger.warn('User has exceeded usage limits', {
        userId,
        usage: usageData.currentUsage,
        limit: usageData.limit,
      })

      // Dispatch event to show a UI notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('usage-exceeded', {
            detail: { usageData },
          })
        )
      }
    } else if (usageData.isWarning) {
      // User is approaching their limit
      logger.info('User approaching usage limits', {
        userId,
        usage: usageData.currentUsage,
        limit: usageData.limit,
        percent: usageData.percentUsed,
      })

      // Dispatch event to show a UI notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('usage-warning', {
            detail: { usageData },
          })
        )

        // Optionally open the subscription tab in settings
        window.dispatchEvent(
          new CustomEvent('open-settings', {
            detail: { tab: 'subscription' },
          })
        )
      }
    }
  } catch (error) {
    logger.error('Error in usage notification system', { error, userId })
  }
}

/**
 * Server-side function to check if a user has exceeded their usage limits
 * For use in API routes, webhooks, and scheduled executions
 *
 * @param userId The ID of the user to check
 * @returns An object containing the exceeded status and usage details
 */
export async function checkServerSideUsageLimits(userId: string): Promise<{
  isExceeded: boolean
  currentUsage: number
  limit: number
  message?: string
}> {
  // Remove usage restrictions - always allow execution
  return {
    isExceeded: false,
    currentUsage: 0,
    limit: 1000000,
  }
}
