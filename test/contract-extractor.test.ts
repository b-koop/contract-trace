import { describe, expect, it } from "vitest";
import { traceContract } from "../src/contract-extractor.js";

const fixture = (name: string) => `test/fixtures/contract-trace-mvp/${name}`;

describe("traceContract", () => {
	it("returns an exposure map with the top comment, imports, JSDoc, and exported declarations", async () => {
		const result = await traceContract({ path: fixture("library.ts") });

		expect(result.contract).toContain("/**\n * Contract trace sample module.");
		expect(result.contract).toContain(
			'import type { ReadonlyDeep } from "./helpers.js";',
		);
		expect(result.contract).toContain(
			'import { joinGreeting } from "./helpers.js";',
		);
		expect(result.contract).toContain(
			"/** Options used to build a greeting. */",
		);
		expect(result.contract).toContain("export interface GreetingOptions");
		expect(result.contract).toContain(
			"export type GreetingId = string | number;",
		);
		expect(result.contract).toContain(
			"export declare const DEFAULT_LIMIT = 3;",
		);
		expect(result.contract).toContain(
			"export declare function buildGreeting(name: string, options?: ReadonlyDeep<GreetingOptions>): string;",
		);
		expect(result.contract).not.toContain("return joinGreeting");
	});

	it("keeps default export contracts without implementation bodies", async () => {
		const result = await traceContract({ path: fixture("default-class.ts") });

		expect(result.contract).toContain(
			'import type { GreetingOptions } from "./library.js";',
		);
		expect(result.contract).toContain("/** Client that greets users. */");
		expect(result.contract).toContain("export default class GreetingClient");
		expect(result.contract).toContain(
			"greet(name: string, options?: GreetingOptions): string;",
		);
		expect(result.contract).not.toContain("return name");
	});

	it("supports JavaScript source files with declaration-style output", async () => {
		const result = await traceContract({
			path: fixture("javascript-source.js"),
		});

		expect(result.contract).toContain("/** JavaScript fixture top comment. */");
		expect(result.contract).toContain(
			'import { joinGreeting } from "./helpers.js";',
		);
		expect(result.contract).toContain(
			"/** Build a greeting from JavaScript. */",
		);
		expect(result.contract).toContain(
			"export function buildJsGreeting(name: any): string;",
		);
		expect(result.contract).toContain("export const jsLimit: 2;");
		expect(result.contract).not.toContain("return joinGreeting");
	});

	it("preserves re-export statements for tracing", async () => {
		const result = await traceContract({ path: fixture("reexports.ts") });

		expect(result.contract).toContain(
			'export { buildGreeting, type GreetingOptions } from "./library.js";',
		);
		expect(result.contract).toContain('export * from "./helpers.js";');
	});
});
