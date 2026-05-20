export type ReadonlyDeep<T> = {
	readonly [K in keyof T]: T[K];
};

export function joinGreeting(prefix: string, value: string): string {
	return `${prefix}/${value}`;
}
