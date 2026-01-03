/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within the
 * specified time, the returned promise rejects with a timeout error.
 *
 * @param promise - The promise to wrap
 * @param ms - Timeout in milliseconds
 * @param message - Optional custom timeout error message
 * @returns The result of the promise if it resolves in time
 * @throws Error if the timeout is reached before the promise resolves
 */
export function withTimeout<T>(
	promise: Promise<T>,
	ms: number,
	message = "Operation timed out"
): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(() => reject(new Error(message)), ms)
		)
	])
}
