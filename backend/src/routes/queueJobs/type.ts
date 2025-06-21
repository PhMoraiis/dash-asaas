export interface TestQueuePayload {
	attempts?: number;
	backoff?: { type: string; delay: number };
	[key: string]: unknown;
}