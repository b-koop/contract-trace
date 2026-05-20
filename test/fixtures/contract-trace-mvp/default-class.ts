import type { GreetingOptions } from "./library.js";

/** Client that greets users. */
export default class GreetingClient {
	/** Create a greeting from the client. */
	greet(name: string, options?: GreetingOptions): string {
		return name + String(options?.excited ?? false);
	}
}
