import ts from "typescript";

export function extractImportStatements(sourceFile: ts.SourceFile): string[] {
	return sourceFile.statements
		.filter(isImportStatement)
		.map((statement) => statement.getFullText(sourceFile).trim())
		.filter((statement) => statement.length > 0);
}

export function removeImportStatements(sourceText: string): string {
	const sourceFile = ts.createSourceFile(
		"contract.d.ts",
		sourceText,
		ts.ScriptTarget.Latest,
		true,
	);
	const removals = sourceFile.statements
		.filter(isImportStatement)
		.map((statement) => [statement.getFullStart(), statement.getEnd()] as const)
		.sort((a, b) => b[0] - a[0]);

	let next = sourceText;
	for (const [start, end] of removals) {
		next = next.slice(0, start) + next.slice(end);
	}

	return next.trim();
}

function isImportStatement(
	statement: ts.Statement,
): statement is ts.ImportDeclaration | ts.ImportEqualsDeclaration {
	return (
		ts.isImportDeclaration(statement) || ts.isImportEqualsDeclaration(statement)
	);
}
