/** JavaScript fixture top comment. */
import { joinGreeting } from "./helpers.js";

/** Build a greeting from JavaScript. */
export function buildJsGreeting(name) {
	return joinGreeting("js", name);
}

export const jsLimit = 2;
