import type { CapturedNode, ComponentProp, ObservedStructuredValue } from "~/domain/artifacts.js";

/**
 * Links inside running text, and putting them back into the paragraph they came from.
 *
 * A link inside a sentence — "you'll love [our ideal location] in Bridgeport" — is a phrase of that
 * sentence. The binder took every `<a>` in a section as a candidate for a standalone Link prop, so Plan
 * lifted the phrase out: the paragraph kept it and the component rendered it again on its own line, or
 * the paragraph was kept without it and the sentence survived only if the component put the pieces back
 * in order. On ParkCity - Take 3 every inline link was lifted (6 of 6). On the 71 Westland rehearsal
 * the home intro lost the rest of its sentence (`inline-links-are-lifted-into-standalone-link-props.md`).
 *
 * The phrase is folded back into the paragraph's rich text, as HTML with its `<a href>`, and the Link
 * prop gives it up. A rich text value is an HTML string by the input's own contract
 * (`createLexicalInput`: "The input value is a string containing HTML").
 */

/**
 * Elements that only wrap a link and carry no text of their own: `<p>…love <strong><a>our ideal
 * location</a></strong> in…</p>`. Read through, or the `<strong>` reads as the paragraph and has no
 * words — which is how the known case was first missed.
 */
const WRAPPERS = new Set(["strong", "em", "b", "i", "span", "u", "font", "small", "mark"]);

/**
 * Words of its own the paragraph needs for the link to be inside running text.
 *
 * Three rules were tried, and two were wrong on stored data. "The parent holds more text than the link"
 * counted every navigation link, because a menu holds the other links' text. "Text on both sides of the
 * link" dropped three real inline links, because Capture sometimes stores the text either side of a link
 * as one run. What is left — the first ancestor with text of its own, read through text-less wrappers,
 * has at least three words — over-reaches only on links beside a block of text, such as The Vibe's
 * "Directions" after an address. The guard in `foldInlineLinks` handles those: a link is folded only into
 * a rich text prop that holds its paragraph.
 */
const MIN_WORDS = 3;

/** A run of this many words shared with the paragraph identifies the prop value holding it. */
const SHARED_WORDS = 5;

const normalise = (text: string): string => text.replace(/\s+/g, " ").trim();

const words = (text: string): string[] =>
    normalise(text)
        .toLowerCase()
        .match(/[\p{L}\p{N}’']+/gu) ?? [];

const runsOf = (node: CapturedNode): string[] =>
    (node.textRuns ?? (node.text ? [node.text] : [])).map(normalise).filter(Boolean);

const ownText = (node: CapturedNode): string => runsOf(node).join(" ");

export const paragraphText = (node: CapturedNode): string => allText(node);

const allText = (node: CapturedNode): string =>
    normalise([ownText(node), ...(node.children ?? []).map(allText)].join(" "));

const contains = (ancestor: CapturedNode, node: CapturedNode): boolean =>
    ancestor === node || (ancestor.children ?? []).some(child => contains(child, node));

export interface InlineLink {
    label: string;
    href: string;
    node: CapturedNode;
    /** The element whose own text surrounds the link. */
    paragraph: CapturedNode;
}

/** Every link inside running text in a section, in document order. */
export const findInlineLinks = (section: CapturedNode): InlineLink[] => {
    const found: InlineLink[] = [];
    const visit = (node: CapturedNode, ancestors: CapturedNode[]): void => {
        if (node.href) {
            let index = ancestors.length - 1;
            while (index >= 0 && WRAPPERS.has(ancestors[index].tag) && !ownText(ancestors[index])) {
                index--;
            }
            const paragraph = ancestors[index];
            const label = allText(node);
            if (paragraph && label && words(ownText(paragraph)).length >= MIN_WORDS) {
                found.push({ label, href: node.href, node, paragraph });
            }
            // A link's children are its label, not further links.
            return;
        }
        for (const child of node.children ?? []) {
            visit(child, [...ancestors, node]);
        }
    };
    visit(section, []);
    return found;
};

const escapeHtml = (text: string): string =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const anchor = (label: string, href: string): string =>
    `<a href="${escapeHtml(href).replace(/"/g, "&quot;")}">${escapeHtml(label)}</a>`;

/** Plain text with the link's label, at its first occurrence, made into the link. Null when absent. */
export const linkLabelInText = (text: string, label: string, href: string): string | null => {
    if (/<a\s[^>]*href=/i.test(text)) {
        return null;
    }
    const at = text.toLowerCase().indexOf(label.toLowerCase());
    if (at < 0) {
        return null;
    }
    const exact = text.slice(at, at + label.length);
    return (
        escapeHtml(text.slice(0, at)) +
        anchor(exact, href) +
        escapeHtml(text.slice(at + label.length))
    );
};

/**
 * The paragraph as HTML with the link in place, rebuilt from its own runs.
 *
 * Capture splits an element's own text into runs where a child element interrupts it, so when there is
 * one more run than children they interleave: run, child, run, child, run. Other children keep their
 * text. Null when the runs and children do not line up, so nothing is guessed.
 */
export const paragraphWithLink = (paragraph: CapturedNode, link: InlineLink): string | null => {
    const runs = runsOf(paragraph);
    const children = paragraph.children ?? [];
    if (runs.length !== children.length + 1) {
        return null;
    }
    const parts: string[] = [escapeHtml(runs[0])];
    children.forEach((child, index) => {
        parts.push(
            contains(child, link.node) ? anchor(link.label, link.href) : escapeHtml(allText(child))
        );
        parts.push(escapeHtml(runs[index + 1]));
    });
    return normalise(
        parts
            .filter(Boolean)
            .join(" ")
            .replace(/ ([.,;:!?)])/g, "$1")
    );
};

/** Does this prop value hold the paragraph: does it share a run of words with it? */
const holds = (value: string, paragraph: string): boolean => {
    const paragraphWords = words(paragraph);
    const valueText = ` ${words(value).join(" ")} `;
    if (paragraphWords.length < SHARED_WORDS) {
        return (
            paragraphWords.length >= MIN_WORDS &&
            valueText.includes(` ${paragraphWords.join(" ")} `)
        );
    }
    for (let start = 0; start + SHARED_WORDS <= paragraphWords.length; start++) {
        if (
            valueText.includes(` ${paragraphWords.slice(start, start + SHARED_WORDS).join(" ")} `)
        ) {
            return true;
        }
    }
    return false;
};

const isRichText = (prop: ComponentProp): boolean => /^(rich\s*text|lexical)$/i.test(prop.type);
const isLinkType = (prop: ComponentProp): boolean => /^(link|url|cta|button)$/i.test(prop.type);
/**
 * A form's submit is never an inline link, and is never given up or removed. On 2424 Tulane a
 * `submitButton` held only "privacy policy" (another slot's value); folding emptied it and would have
 * removed the form's submit from the contract.
 */
const isSubmitProp = (prop: ComponentProp): boolean => /submit|send/i.test(prop.name);
const sameLabel = (a: string, b: string): boolean =>
    normalise(a).toLowerCase() === normalise(b).toLowerCase();

export interface FoldedLink {
    label: string;
    href: string;
    /** The rich text prop the link now lives in. */
    into: string;
    /** The Link props that gave it up. */
    from: string[];
}

export interface FoldResult {
    folded: FoldedLink[];
    /** Link props removed because every value they held was folded into a paragraph. */
    pruned: string[];
}

/**
 * Folds inline links that a Link prop lifted back into the rich text prop holding their paragraph, and
 * removes a Link prop left with nothing. Runs after the binder, on the same member sections, and mutates
 * `props` as the binder does.
 *
 * **Only where a rich text prop holds the paragraph.** That is the one place the link can go with its
 * destination; a paragraph Plan put in a plain string (a heading, an address) cannot carry an `<a>`, and
 * folding there would lose the destination — worse than the duplication. Those links stay Link props.
 * Across the 33 stored plans that leaves 12 cases unfolded whose paragraph went to the wrong prop.
 *
 * Only links a Link prop actually lifted are folded, so a paragraph whose link was left alone is left
 * alone too.
 */
export const foldInlineLinks = (sections: CapturedNode[], props: ComponentProp[]): FoldResult => {
    const result: FoldResult = { folded: [], pruned: [] };
    const richProps = props.filter(isRichText);
    const linkProps = props.filter(prop => isLinkType(prop) && !isSubmitProp(prop));
    if (richProps.length === 0 || linkProps.length === 0) {
        return result;
    }
    const lifted = (label: string): ComponentProp[] =>
        linkProps.filter(
            prop =>
                prop.observedValues.some(value => sameLabel(value, label)) ||
                (prop.observedStructured ?? []).some(
                    value => value.kind === "link" && sameLabel(value.label ?? "", label)
                )
        );

    const before = new Map(linkProps.map(prop => [prop, prop.observedValues.length]));
    const foldedLabels = new Set<string>();

    for (const section of sections) {
        for (const link of findInlineLinks(section)) {
            const from = lifted(link.label);
            if (from.length === 0) {
                continue;
            }
            const paragraph = allText(link.paragraph);
            /*
             * One value per link. First a value that already holds the link's text, where the link is
             * wrapped in place; failing that, the first value holding the paragraph, rebuilt from its
             * runs. Replacing every value that shares words with the paragraph put the same rebuilt
             * paragraph into two of Property Description's samples.
             */
            // Already folded on an earlier pass (a re-bind of a re-bound plan): count it, change nothing.
            let into: string | null =
                richProps.find(prop =>
                    prop.observedValues.some(
                        value =>
                            typeof value === "string" &&
                            value
                                .toLowerCase()
                                .includes(`>${escapeHtml(link.label).toLowerCase()}</a>`)
                    )
                )?.name ?? null;
            for (const pass of ["wrap", "rebuild"] as const) {
                for (const prop of richProps) {
                    if (into) {
                        break;
                    }
                    const index = prop.observedValues.findIndex(
                        value =>
                            typeof value === "string" &&
                            holds(value, paragraph) &&
                            (pass === "wrap"
                                ? linkLabelInText(value, link.label, link.href) !== null
                                : paragraphWithLink(link.paragraph, link) !== null)
                    );
                    if (index < 0) {
                        continue;
                    }
                    const value = prop.observedValues[index];
                    prop.observedValues[index] =
                        pass === "wrap"
                            ? linkLabelInText(value, link.label, link.href)!
                            : paragraphWithLink(link.paragraph, link)!;
                    into = prop.name;
                }
            }
            if (!into) {
                continue;
            }
            foldedLabels.add(normalise(link.label).toLowerCase());
            result.folded.push({
                label: link.label,
                href: link.href,
                into,
                from: from.map(prop => prop.name)
            });
        }
    }

    for (const prop of linkProps) {
        prop.observedValues = prop.observedValues.filter(
            value => !foldedLabels.has(normalise(value).toLowerCase())
        );
        if (prop.observedStructured) {
            prop.observedStructured = prop.observedStructured.filter(
                (value: ObservedStructuredValue) =>
                    !(
                        value.kind === "link" &&
                        foldedLabels.has(normalise(value.label ?? "").toLowerCase())
                    )
            );
        }
        const emptied =
            (before.get(prop) ?? 0) > 0 &&
            prop.observedValues.length === 0 &&
            (prop.observedStructured ?? []).length === 0;
        if (emptied) {
            props.splice(props.indexOf(prop), 1);
            result.pruned.push(prop.name);
        }
    }
    return result;
};
