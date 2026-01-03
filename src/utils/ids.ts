export function generateWorkerId(): string {
	return `worker-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
