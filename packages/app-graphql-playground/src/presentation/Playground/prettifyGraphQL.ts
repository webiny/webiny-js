import { parse } from "graphql";
import { print } from "graphql";
import type { Token } from "graphql";

interface TokenEntry {
    kind: string;
    value: string;
    line: number;
}

interface CommentEntry {
    text: string;
    prevIndex: number;
    nextIndex: number;
    isTrailing: boolean;
}

/* Prettify a GraphQL query while preserving # comments. */
export function prettifyGraphQL(source: string): string {
    const ast = parse(source);
    const formatted = print(ast);

    const origResult = walkTokens(ast.loc!.startToken, source);
    if (origResult.comments.length === 0) {
        return formatted;
    }

    const fmtAst = parse(formatted);
    const fmtTokens = walkTokens(fmtAst.loc!.startToken, formatted).tokens;

    /* Align original tokens → formatted tokens via greedy match. */
    const alignment = new Map<number, number>();
    let fi = 0;
    for (let oi = 0; oi < origResult.tokens.length && fi < fmtTokens.length; oi++) {
        const orig = origResult.tokens[oi];
        const fmt = fmtTokens[fi];
        if (orig.kind === fmt.kind && orig.value === fmt.value) {
            alignment.set(oi, fi);
            fi++;
        }
    }

    return insertComments(formatted, fmtTokens, origResult, alignment);
}

function walkTokens(startToken: Token, source: string) {
    const tokens: TokenEntry[] = [];
    const comments: CommentEntry[] = [];
    let token: Token | null = startToken;
    let index = 0;
    let lastLine = 0;

    while (token) {
        if (token.kind === "Comment") {
            comments.push({
                text: source.slice(token.start, token.end),
                prevIndex: index - 1,
                nextIndex: index,
                isTrailing: lastLine > 0 && token.line === lastLine
            });
        } else if (token.kind !== "<SOF>" && token.kind !== "<EOF>") {
            tokens.push({ kind: token.kind, value: token.value, line: token.line });
            lastLine = token.line;
            index++;
        }

        token = token.next;
    }

    for (const c of comments) {
        if (c.nextIndex >= tokens.length) {
            c.nextIndex = -1;
        }
    }

    return { tokens, comments };
}

function resolveFormattedIndex(
    origIndex: number,
    origTokenCount: number,
    alignment: Map<number, number>
): number | null {
    /* Try the exact index first, then search forward for the nearest aligned token. */
    for (let i = origIndex; i < origTokenCount; i++) {
        const fmtIdx = alignment.get(i);
        if (fmtIdx !== undefined) {
            return fmtIdx;
        }
    }
    return null;
}

function insertComments(
    formatted: string,
    fmtTokens: TokenEntry[],
    origResult: { tokens: TokenEntry[]; comments: CommentEntry[] },
    alignment: Map<number, number>
): string {
    const lines = formatted.split("\n");

    /* Trailing comments: append to the previous token's line. */
    for (const c of origResult.comments) {
        if (!c.isTrailing || c.prevIndex < 0) {
            continue;
        }
        const fmtIdx = alignment.get(c.prevIndex);
        if (fmtIdx === undefined) {
            continue;
        }
        const lineIdx = fmtTokens[fmtIdx].line - 1;
        lines[lineIdx] += " " + c.text;
    }

    /* Standalone comments: group by formatted anchor line. */
    const grouped = new Map<number, string[]>();
    const noAnchor: string[] = [];

    for (const c of origResult.comments) {
        if (c.isTrailing) {
            continue;
        }

        let fmtIdx: number | null = null;
        if (c.nextIndex >= 0) {
            fmtIdx = resolveFormattedIndex(c.nextIndex, origResult.tokens.length, alignment);
        }

        if (fmtIdx !== null) {
            const existing = grouped.get(fmtIdx);
            if (existing) {
                existing.push(c.text);
            } else {
                grouped.set(fmtIdx, [c.text]);
            }
        } else {
            noAnchor.push(c.text);
        }
    }

    const insertions: Array<{ lineIdx: number; texts: string[] }> = [];

    for (const [fmtIdx, texts] of grouped) {
        insertions.push({ lineIdx: fmtTokens[fmtIdx].line - 1, texts });
    }

    if (noAnchor.length > 0) {
        insertions.push({ lineIdx: lines.length, texts: noAnchor });
    }

    /* Sort descending so splices don't shift earlier insertions. */
    insertions.sort((a, b) => b.lineIdx - a.lineIdx);

    for (const ins of insertions) {
        const indent =
            ins.lineIdx < lines.length ? lines[ins.lineIdx]?.match(/^(\s*)/)?.[1] || "" : "";
        const commentLines = ins.texts.map(t => indent + t);
        lines.splice(ins.lineIdx, 0, ...commentLines);
    }

    return lines.join("\n");
}
