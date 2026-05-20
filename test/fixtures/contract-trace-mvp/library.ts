/**
 * Contract trace sample module.
 * This top-level file comment should stay at the top of the contract.
 */
import type { ReadonlyDeep } from "./helpers.js";
import { joinGreeting } from "./helpers.js";

/** Options used to build a greeting. */
export interface GreetingOptions {
	/** Whether to shout the greeting. */
	excited?: boolean;
}

/** Identifier accepted by the public API. */
export type GreetingId = string | number;

/** Default greeting limit. */
export const DEFAULT_LIMIT = 3;

/** Builds a greeting for display. */
export function buildGreeting(
	name: string,
	options?: ReadonlyDeep<GreetingOptions>,
): string {
	const suffix = options?.excited ? "!" : ".";
	return joinGreeting("hello", `${name}${suffix}`);
}
