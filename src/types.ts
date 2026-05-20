export interface TraceContractOptions {
	path: string;
	includeHeaderComment?: boolean;
	includeImports?: boolean;
	includeJsDoc?: boolean;
}

export interface TraceContractResult {
	path: string;
	contract: string;
	headerComment?: string;
	imports: string[];
}
