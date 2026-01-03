export function formatDuration(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000)
	if (totalSeconds < 60) {
		return `${totalSeconds}s`
	}

	const totalMinutes = Math.floor(totalSeconds / 60)
	if (totalMinutes < 60) {
		return `${totalMinutes}min`
	}

	const totalHours = Math.floor(totalMinutes / 60)
	if (totalHours < 24) {
		const minutes = totalMinutes % 60
		return `${totalHours}h ${minutes}min`
	}

	const totalDays = Math.floor(totalHours / 24)
	const hours = totalHours % 24
	return `${totalDays}d ${hours}h`
}
