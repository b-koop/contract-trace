import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";
import { traceContract } from "./contract-extractor.js";

const traceContractSchema = Type.Object({
	path: Type.String({
		description: "Path to the TypeScript or JavaScript file to trace.",
	}),
	includeHeaderComment: Type.Optional(
		Type.Boolean({
			description:
				"Include the top /** file comment block when present. Defaults to true.",
		}),
	),
	includeImports: Type.Optional(
		Type.Boolean({
			description:
				"Preserve import statements for dependency tracing. Defaults to true.",
		}),
	),
	includeJsDoc: Type.Optional(
		Type.Boolean({
			description:
				"Include /** JSDoc comments on exported declarations. Defaults to true.",
		}),
	),
});

type TraceContractToolInput = Static<typeof traceContractSchema>;

export default function contractTraceExtension(pi: ExtensionAPI) {
	pi.registerTool({
		name: "trace_contract",
		label: "Trace Contract",
		description:
			"Return an Exposure Map for a TypeScript/JavaScript file: top comment block, imports, and declaration-style exported contracts without implementation bodies.",
		promptSnippet:
			"Trace a TS/JS file contract by preserving comments, imports, and exported declaration signatures.",
		promptGuidelines: [
			"Use trace_contract when the user asks for a file's public TypeScript/JavaScript contract, signature surface, or contract tracing context.",
		],
		parameters: traceContractSchema,
		async execute(_toolCallId, params: TraceContractToolInput) {
			const result = await traceContract(params);

			return {
				content: [{ type: "text", text: result.contract }],
				details: result,
			};
		},
	});
}

export { traceContract } from "./contract-extractor.js";
export type { TraceContractOptions, TraceContractResult } from "./types.js";
