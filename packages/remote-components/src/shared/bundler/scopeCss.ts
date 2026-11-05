/*
 * Only the parser and the walker, not the `css-tree` root: the root also loads the lexer data
 * through `createRequire(import.meta.url)` and `require("../data/patch.json")`, which the Lambda
 * bundle cannot resolve ("Cannot find module '../data/patch.json'" at cold start).
 */
// @ts-expect-error No types available
import parseCss from "css-tree/parser";
// @ts-expect-error No types available
import walkCss from "css-tree/walker";

function scopeCssWithRegex(css: string, scope: string): string {
    return css.replace(/(^|\})\s*([^@{}][^{]*)\{/g, (match, prefix, selector) => {
        const trimmed = selector.trim();
        if (trimmed.startsWith(":root") || trimmed.startsWith("@")) {
            return match;
        }
        const scopedSelectors = trimmed
            .split(",")
            .map((s: string) => `.${scope} ${s.trim()}`)
            .join(", ");
        return `${prefix}${scopedSelectors}{`;
    });
}

interface PreludeEdit {
    start: number;
    end: number;
    text: string;
}

/**
 * Prefixes the selectors of every rule, including rules inside at-rules such as `@media`.
 * Only selector preludes are rewritten, in place, so declarations, comments and whitespace
 * stay as written. The replaced range matches what the previous regex replaced (whitespace
 * before the selector up to the `{`), so CSS without at-rules produces the same output.
 * Nested rules are left alone, since their `&` already refers to the scoped parent.
 */
export function scopeCss(css: string, scope: string): string {
    const edits: PreludeEdit[] = [];

    try {
        const ast = parseCss(css, {
            positions: true,
            onParseError(error: Error) {
                throw error;
            }
        });

        walkCss(ast, {
            visit: "Rule",
            enter(this: any, node: any) {
                // Keyframe selectors (`from`, `50%`) are not element selectors.
                if (this.atrule && /keyframes$/i.test(this.atrule.name)) {
                    return;
                }
                // A nested rule resolves `&` against its already scoped parent.
                if (this.rule) {
                    return;
                }
                const prelude = node.prelude;
                if (
                    !prelude ||
                    prelude.type !== "SelectorList" ||
                    !prelude.loc ||
                    !node.block?.loc
                ) {
                    return;
                }

                const selectors: any[] = prelude.children.toArray();
                const texts: string[] = selectors.map((selector: any) =>
                    css.slice(selector.loc.start.offset, selector.loc.end.offset).trim()
                );
                if (texts.every(text => text.startsWith(":root"))) {
                    return;
                }

                let start = prelude.loc.start.offset;
                while (start > 0 && /\s/.test(css[start - 1])) {
                    start--;
                }
                const end = node.block.loc.start.offset;

                // Keep any comments around the selectors; normalize plain separators to ", "
                // and drop whitespace before the `{`, as the regex did.
                let text = css.slice(start, selectors[0].loc.start.offset).trim();
                texts.forEach((selector, index) => {
                    text += selector.startsWith(":root") ? selector : `.${scope} ${selector}`;
                    const gapEnd =
                        index < selectors.length - 1 ? selectors[index + 1].loc.start.offset : end;
                    const gap = css.slice(selectors[index].loc.end.offset, gapEnd);
                    if (index < selectors.length - 1) {
                        text += /^\s*,\s*$/.test(gap) ? ", " : gap;
                    } else {
                        text += gap.trimEnd();
                    }
                });

                edits.push({ start, end, text });
            }
        });
    } catch {
        return scopeCssWithRegex(css, scope);
    }

    let scoped = css;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
        scoped = scoped.slice(0, edit.start) + edit.text + scoped.slice(edit.end);
    }
    return scoped;
}
