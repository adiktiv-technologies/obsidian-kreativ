/**
 * System health utilities - provides static methods for retrieving system metrics.
 */
import { SystemHealth } from "../../global"

/**
 * Static utility class for system health monitoring.
 */
export class SystemHealthUtil {
	private static startTime: number = Date.now()

	/**
	 * Get detailed system health information.
	 */
	static getSystemHealth(): SystemHealth {
		// Access performance.memory if available (Chrome/Chromium-based)
		const memory = (performance as Performance & {
			memory?: {
				usedJSHeapSize: number
				totalJSHeapSize: number
				jsHeapSizeLimit: number
			}
		}).memory

		return {
			memoryUsage: {
				usedJSHeapSize: memory?.usedJSHeapSize,
				totalJSHeapSize: memory?.totalJSHeapSize,
				jsHeapSizeLimit: memory?.jsHeapSizeLimit,
			},
			timestamp: Date.now(),
			workerUptime: Date.now() - this.startTime,
		}
	}

	/**
	 * Get the current uptime in milliseconds.
	 */
	static getUptime(): number {
		return Date.now() - this.startTime
	}

	/**
	 * Reset the start time (useful when worker restarts).
	 */
	static resetStartTime(): void {
		this.startTime = Date.now()
	}

}
