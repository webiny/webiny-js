import type { CapturedNode, ComponentProp, ObservedStructuredValue } from "~/domain/artifacts.js";
import {
    collectImages,
    collectLinks,
    collectPlainTexts,
    coverage,
    siblingGroups,
    type HarvestedImage,
    type HarvestedLink
} from "./harvestSectionValues.js";

/**
 * Fills a contract's non-text props from the section the reference image was cropped from.
 *
 * Two rules, because a list and a scalar are different questions:
 *
 * - **A list prop takes one repeated subtree per item.** A card's image, heading and link belong
 *   together only if they came from the same node; harvesting each field across the whole section and
 *   zipping the results is how one card's label lands beside another card's destination.
 * - **A scalar prop takes the next value of its kind, in document order.** The same positional rule the
 *   text derivation uses, with the same weakness, and no better evidence available at Plan time.
 *
 * Whatever a bound value contributes as text — a link's label, an item's heading — is also appended to
 * `observedValues`. That is deliberate: it keeps the existing text path working unchanged, so the
 * prompt, the text-preservation validator and the member-text coverage check all see these values
 * without any of them learning about a new type.
 */

/** Bounded so one pathological section cannot inflate the Plan artifact. */
const MAX_VALUES_PER_PROP = 10;
const MAX_ITEMS_PER_LIST = 12;
/** Across every member, since a cluster can have a dozen of them. */
const MAX_VALUES_TOTAL = 40;

const isMediaType = (type: string): boolean => /^(image|media|photo|picture|file)$/i.test(type);
const isLinkType = (type: string): boolean => /^(link|url|cta|button)$/i.test(type);
/** A Link prop for a form's submit, by its name (`submitButton`, `sendButton`, `submit`). */
const isSubmitProp = (prop: ComponentProp): boolean => /submit|send/i.test(prop.name);

type FieldKind = "media" | "link" | "text";

const fieldKind = (prop: ComponentProp): FieldKind =>
    isMediaType(prop.type) ? "media" : isLinkType(prop.type) ? "link" : "text";

/** What one item subtree can offer, read once so scoring and filling agree. */
interface ItemContent {
    images: HarvestedImage[];
    links: HarvestedLink[];
    texts: string[];
}

const readItem = (node: CapturedNode): ItemContent => ({
    images: collectImages(node),
    links: collectLinks(node),
    texts: collectPlainTexts(node)
});

/**
 * How many of a list's fields this item can actually supply.
 *
 * Counting satisfied fields rather than total content, because the question is whether this grouping
 * is the list — a row of three cards each offering an image, a heading and a link scores 3, while the
 * single wrapper holding all of them scores the same 3 and is not a list of anything.
 */
/** The text field that names a picture: filled from the picture's own alt, not the text beside it. */
const altFieldOf = (fields: ComponentProp[]): ComponentProp | undefined =>
    fields.find(field => /^alt(text)?$/i.test(field.name) && fieldKind(field) === "text");

/*
 * How many of a list's fields an item can fill. An `alt` field counts as filled by the item's picture:
 * Park City's photo carousel lost to its three paragraphs because a paragraph filled `alt` as text while
 * a photograph, alt and all, filled only `src` — so the component shipped paragraphs as image alts and
 * no photographs. Counting the picture's alt makes the carousel the better fit on its merits, and a
 * section with no pictures binds exactly as it did.
 */
const satisfied = (content: ItemContent, fields: ComponentProp[]): number => {
    let used = { media: 0, link: 0, text: 0 };
    let count = 0;
    const altField = altFieldOf(fields);
    for (const field of fields) {
        if (field === altField && content.images[0]?.alt) {
            count++;
            continue;
        }
        const kind = fieldKind(field);
        const available =
            kind === "media"
                ? content.images.length
                : kind === "link"
                  ? content.links.length
                  : content.texts.length;
        if (used[kind] < available) {
            used = { ...used, [kind]: used[kind] + 1 };
            count++;
        }
    }
    return count;
};

/** Fills one item's fields from its own subtree, in field order, each kind taken in document order. */
const fillItem = (
    content: ItemContent,
    fields: ComponentProp[]
): Record<string, string | { src: string; alt?: string } | { label: string; href: string }> => {
    const next = { media: 0, link: 0, text: 0 };
    const record: Record<
        string,
        string | { src: string; alt?: string } | { label: string; href: string }
    > = {};
    // An item's alt text is its picture's alt, not the next run of text beside it.
    const altField = altFieldOf(fields);
    for (const field of fields) {
        const kind = fieldKind(field);
        if (field === altField && content.images[0]?.alt) {
            record[field.name] = content.images[0].alt;
            continue;
        }
        if (kind === "media" && next.media < content.images.length) {
            const image = content.images[next.media++];
            record[field.name] = image.alt
                ? { src: image.src, alt: image.alt }
                : { src: image.src };
        } else if (kind === "link" && next.link < content.links.length) {
            const link = content.links[next.link++];
            record[field.name] = { label: link.label, href: link.href };
        } else if (kind === "text" && next.text < content.texts.length) {
            record[field.name] = content.texts[next.text++];
        }
    }
    return record;
};

/** Every string a structured value contributes, so the text path sees it without knowing the type. */
export const textsOf = (value: ObservedStructuredValue): string[] => {
    if (value.kind === "link") {
        return value.label ? [value.label] : [];
    }
    if (value.kind === "media") {
        return value.alt ? [value.alt] : [];
    }
    return Object.values(value.fields).flatMap(field => {
        if (typeof field === "string") {
            return field ? [field] : [];
        }
        if ("label" in field) {
            return field.label ? [field.label] : [];
        }
        return field.alt ? [field.alt] : [];
    });
};

export interface BindSummary {
    /** Props that received at least one structured value. */
    propsBound: number;
    mediaBound: number;
    linksBound: number;
    itemsBound: number;
}

/**
 * Binds across EVERY member's section, not just the one the reference image came from.
 *
 * `observedValues` has always been "sample values observed across the cluster's members", and the
 * first version of this bound the representative's section alone. Measured, that reclaimed 28 of the
 * 233 texts the union-text narrowing had left without a prop — and it could not have done better,
 * because those 233 are by definition the texts that are NOT in the representative. Another page's
 * navigation labels are not in this page's navigation, so a prop filled from one section cannot hold
 * them.
 *
 * Each section is bound with its own claim set — taking is a within-section question — and the values
 * are merged, deduped, across members.
 */
export const bindObservedValues = (
    sections: CapturedNode[],
    props: ComponentProp[]
): BindSummary => {
    const summary: BindSummary = { propsBound: 0, mediaBound: 0, linksBound: 0, itemsBound: 0 };
    const bound = new Set<ComponentProp>();
    for (const [member, section] of sections.entries()) {
        bindOneSection(section, props, summary, bound, member);
    }
    summary.propsBound = bound.size;
    return summary;
};

const bindOneSection = (
    node: CapturedNode,
    props: ComponentProp[],
    summary: BindSummary,
    bound: Set<ComponentProp>,
    /** Which copy of the section this is: 0 is the representative. */
    member: number
): void => {
    /*
     * Nodes some prop has taken. Every read goes through this, scalars included — an earlier version
     * collected the section's images and links once up front and indexed into those lists, so a scalar
     * prop sitting after a list re-bound a link the list had already claimed. Claiming the element a
     * value came from, and re-reading what is left, is the only version where "taken" means the same
     * thing to both rules.
     */
    const claimed = new Set<CapturedNode>();
    // Submit controls bound to a submit prop, apart from `claimed`: list items may claim them first.
    const submitsTaken = new Set<CapturedNode>();

    const bind = (prop: ComponentProp): void => {
        const values: ObservedStructuredValue[] = [];

        if (prop.array && prop.fields?.length) {
            const fields = prop.fields;
            const candidates = siblingGroups(node, claimed)
                .map(group => {
                    const contents = group.nodes.map(readItem);
                    const score = contents.reduce(
                        (total, content) => total + satisfied(content, fields),
                        0
                    );
                    return { group, contents, score };
                })
                .filter(candidate => candidate.score > 0)
                // Most fields filled wins; then the grouping that explains more of the section; then
                // the shallower one, which is the row rather than something inside one of its cells.
                .sort(
                    (a, b) =>
                        b.score - a.score ||
                        b.group.nodes.reduce((t, n) => t + coverage(n, claimed), 0) -
                            a.group.nodes.reduce((t, n) => t + coverage(n, claimed), 0) ||
                        a.group.depth - b.group.depth
                );

            const best = candidates[0];
            if (best) {
                for (const [index, content] of best.contents.entries()) {
                    if (index >= MAX_ITEMS_PER_LIST) {
                        break;
                    }
                    const fieldValues = fillItem(content, fields);
                    if (Object.keys(fieldValues).length > 0) {
                        values.push({ kind: "item", fields: fieldValues });
                    }
                }
                if (values.length > 0) {
                    best.group.nodes.forEach(item => claimed.add(item));
                    summary.itemsBound += values.length;
                }
            }
        } else if (isMediaType(prop.type)) {
            const take = prop.array ? MAX_VALUES_PER_PROP : 1;
            for (const image of collectImages(node, claimed).slice(0, take)) {
                values.push(
                    image.alt
                        ? { kind: "media", src: image.src, alt: image.alt }
                        : { kind: "media", src: image.src }
                );
                claimed.add(image.node);
                summary.mediaBound++;
            }
        } else if (isLinkType(prop.type)) {
            const take = prop.array ? MAX_VALUES_PER_PROP : 1;
            const links = collectLinks(node, claimed);
            /*
             * A prop named for a form's submit takes the section's submit control when it has one.
             * Positionally it took the next link instead: on three G5 forms, a "Please Call" phone link
             * that sits before the submit, so the form shipped a phone number as its submit button.
             *
             * Looked up past the claims: a form's field list (bound first, in contract order) claims the
             * form's children as its items, the submit input among them, and on Freehill's form that
             * hid the submit from this prop. A field list never binds a submit control as a field;
             * a submit control still goes to one submit prop only.
             */
            const submits = isSubmitProp(prop)
                ? collectLinks(node).filter(link => !link.href && !submitsTaken.has(link.node))
                : [];
            for (const link of (submits.length > 0 ? submits : links).slice(0, take)) {
                if (submits.length > 0) {
                    submitsTaken.add(link.node);
                }
                values.push({ kind: "link", label: link.label, href: link.href });
                claimed.add(link.node);
                summary.linksBound++;
            }
        }

        if (values.length > 0) {
            // Merge with what earlier members contributed. Deduped on the value's own identity — the
            // same logo appears on every page and should be observed once — and kept under the
            // earliest copy that showed it, so a value the representative shows stays its own.
            const identity = ({ member: _member, ...value }: ObservedStructuredValue) =>
                JSON.stringify(value);
            const existingStructured = prop.observedStructured ?? [];
            const seenValues = new Set(existingStructured.map(identity));
            for (const value of values) {
                const key = identity(value);
                if (!seenValues.has(key) && existingStructured.length < MAX_VALUES_TOTAL) {
                    seenValues.add(key);
                    existingStructured.push({ ...value, member });
                }
            }
            prop.observedStructured = existingStructured;
            bound.add(prop);

            // The text these values carry joins the existing string path, deduped against what is
            // already there — the model's own proposal may already have named the same label.
            const existing = new Set(prop.observedValues);
            for (const text of values.flatMap(textsOf)) {
                if (text && !existing.has(text)) {
                    existing.add(text);
                    prop.observedValues.push(text);
                }
            }
        }

        // A composite prop's own sub-fields are not bound separately: the parent took the whole value.
        if (!values.length) {
            for (const field of prop.fields ?? []) {
                bind(field);
            }
        }
    };

    for (const prop of props) {
        bind(prop);
    }
};
