import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import ts from "typescript";
import { extractTopCommentBlock } from "./header-comments.js";
import { extractImportStatements, removeImportStatements } from "./imports.js";
import type { TraceContractOptions, TraceContractResult } from "./types.js";

const SUPPORTED_EXTENSIONS = new Set([
	".ts",
	".tsx",
	".js",
	".jsx",
	".mts",
	".cts",
	".mjs",
	".cjs",
]);

export async function traceContract(
	options: TraceContractOptions,
): Promise<TraceContractResult> {
	const includeHeaderComment = options.includeHeaderComment ?? true;
	const includeImports = options.includeImports ?? true;
	const includeJsDoc = options.includeJsDoc ?? true;
	const absolutePath = resolvePath(options.path);
	const sourceText = await readFile(absolutePath, "utf8");
	const sourceFile = ts.createSourceFile(
		absolutePath,
		sourceText,
		ts.ScriptTarget.Latest,
		true,
		getScriptKind(absolutePath),
	);

	const headerComment = includeHeaderComment
		? extractTopCommentBlock(sourceText)
		: undefined;
	const imports = includeImports ? extractImportStatements(sourceFile) : [];
	const declarations = emitDeclarations(absolutePath, sourceText, includeJsDoc);
	const declarationBody = removeImportStatements(declarations);
	const contract = joinSections([headerComment, ...imports, declarationBody]);

	return {
		path: absolutePath,
		contract,
		headerComment,
		imports,
	};
}

function resolvePath(inputPath: string): string {
	const normalized =
		inputPath.startsWith("@/") || inputPath.startsWith("@.")
			? inputPath.slice(1)
			: inputPath;
	const absolutePath = isAbsolute(normalized)
		? normalized
		: resolve(process.cwd(), normalized);
	const extension = absolutePath.slice(absolutePath.lastIndexOf("."));

	if (
		absolutePath.endsWith(".d.ts") ||
		absolutePath.endsWith(".d.mts") ||
		absolutePath.endsWith(".d.cts")
	) {
		throw new Error(
			"Declaration files are already contracts and are not supported as trace sources.",
		);
	}

	if (!SUPPORTED_EXTENSIONS.has(extension)) {
		throw new Error(`Unsupported contract source extension: ${extension}`);
	}

	return absolutePath;
}

function getScriptKind(path: string): ts.ScriptKind {
	if (path.endsWith(".tsx")) return ts.ScriptKind.TSX;
	if (path.endsWith(".jsx")) return ts.ScriptKind.JSX;
	if (path.endsWith(".js") || path.endsWith(".mjs") || path.endsWith(".cjs"))
		return ts.ScriptKind.JS;
	return ts.ScriptKind.TS;
}

function emitDeclarations(
	absolutePath: string,
	sourceText: string,
	includeJsDoc: boolean,
): string {
	let declarationText: string | undefined;
	const outDir = resolve(tmpdir(), "contract-trace-declarations");
	const expectedDeclarationPath = getDeclarationOutputPath(
		outDir,
		absolutePath,
	);
	const compilerOptions: ts.CompilerOptions = {
		allowJs: true,
		checkJs: false,
		declaration: true,
		emitDeclarationOnly: true,
		module: ts.ModuleKind.NodeNext,
		moduleResolution: ts.ModuleResolutionKind.NodeNext,
		noEmitOnError: true,
		outDir,
		rootDir: process.cwd(),
		removeComments: !includeJsDoc,
		skipLibCheck: true,
		strict: true,
		target: ts.ScriptTarget.ES2022,
	};
	const defaultHost = ts.createCompilerHost(compilerOptions);
	const host: ts.CompilerHost = {
		...defaultHost,
		getSourceFile(
			fileName,
			languageVersion,
			onError,
			shouldCreateNewSourceFile,
		) {
			if (sameFile(fileName, absolutePath)) {
				return ts.createSourceFile(
					fileName,
					sourceText,
					languageVersion,
					true,
					getScriptKind(fileName),
				);
			}
			return defaultHost.getSourceFile(
				fileName,
				languageVersion,
				onError,
				shouldCreateNewSourceFile,
			);
		},
		readFile(fileName) {
			if (sameFile(fileName, absolutePath)) return sourceText;
			return defaultHost.readFile(fileName);
		},
		writeFile(fileName, text) {
			if (sameFile(fileName, expectedDeclarationPath)) {
				declarationText = text;
			}
		},
	};
	const program = ts.createProgram([absolutePath], compilerOptions, host);
	const diagnostics = ts.getPreEmitDiagnostics(program);
	if (diagnostics.length > 0) {
		throw new Error(formatDiagnostics(diagnostics));
	}
	const emitResult = program.emit(undefined, host.writeFile, undefined, true);
	if (emitResult.emitSkipped) {
		throw new Error(formatDiagnostics(emitResult.diagnostics));
	}

	if (!declarationText) {
		throw new Error(`Unable to emit contract declaration for ${absolutePath}`);
	}

	return declarationText.trim();
}

function joinSections(sections: Array<string | undefined>): string {
	return sections
		.map((section) => section?.trim())
		.filter((section): section is string => Boolean(section))
		.join("\n\n")
		.trimEnd();
}

function sameFile(a: string, b: string): boolean {
	return resolve(a) === resolve(b);
}

function getDeclarationOutputPath(outDir: string, sourcePath: string): string {
	return resolve(
		outDir,
		relative(process.cwd(), sourcePath)
			.replace(/\.mts$/, ".d.mts")
			.replace(/\.cts$/, ".d.cts")
			.replace(/\.[tj]sx?$/, ".d.ts")
			.replace(/\.mjs$/, ".d.ts")
			.replace(/\.cjs$/, ".d.ts"),
	);
}

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
	if (diagnostics.length === 0) return "Unable to emit contract declaration.";

	return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
		getCanonicalFileName: (fileName) => fileName,
		getCurrentDirectory: () => process.cwd(),
		getNewLine: () => "\n",
	});
}
