/**
 * Global type declarations for Kreativ plugin
 */

declare interface Pipeline {
	load(): Promise<void>
	unload(): void
	isReady(): boolean
	isLoadingModel(): boolean
}
