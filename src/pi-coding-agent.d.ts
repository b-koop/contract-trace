declare module "@earendil-works/pi-coding-agent" {
	export interface ExtensionAPI {
		registerTool(definition: {
			name: string;
			label?: string;
			description: string;
			promptSnippet?: string;
			promptGuidelines?: string[];
			parameters: unknown;
			execute(
				toolCallId: string,
				params: unknown,
				signal?: AbortSignal,
				onUpdate?: (update: unknown) => void,
				ctx?: unknown,
			): Promise<unknown> | unknown;
		}): void;
	}
}
