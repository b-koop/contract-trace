import ts from "typescript";

export function extractTopCommentBlock(sourceText: string): string | undefined {
	const ranges = ts.getLeadingCommentRanges(sourceText, 0) ?? [];
	const firstBlock = ranges.find((range) => {
		const text = sourceText.slice(range.pos, range.end);
		return text.startsWith("/**");
	});

	if (!firstBlock) return undefined;

	return sourceText.slice(firstBlock.pos, firstBlock.end).trim();
}
