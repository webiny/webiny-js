import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";
import type { ComponentInput, ComponentManifest } from "@webiny/website-builder-sdk";
import {
    collectImages,
    collectLinks,
    collectPlainTexts,
    coverage,
    siblingGroups
} from "~/pages/harvest.js";

/** A manifest input, loosened to what a parsed manifest actually carries. */
interface InputDefinition {
    name: string;
    type?: string;
    list?: boolean;
    fields?: InputDefinition[];
}

const asDefinition = (input: ComponentInput): InputDefinition =>
    input as unknown as InputDefinition;

const TEXT_TYPES = new Set(["text", "longText", "lexical"]);
const IMAGE_TYPES = new Set(["file", "image"]);

/**
 * A destination field is recognised by NAME, not by type.
 *
 * The generator types these as plain `text` — the real footer manifest declares `url: text` beside
 * `label: text` — so going by type would fill a destination with a label and lose every href.
 */
const isUrlField = (definition: InputDefinition): boolean =>
    definition.type === "url" || /(^|[^a-z])(url|href|link|to)([^a-z]|$)/i.test(definition.name);

const isImageField = (definition: InputDefinition): boolean =>
    (definition.type !== undefined && IMAGE_TYPES.has(definition.type)) ||
    /(image|icon|logo|avatar|thumbnail|src)/i.test(definition.name);

const isAltField = (definition: InputDefinition): boolean => /(alt|caption)/i.test(definition.name);

const isTextField = (definition: InputDefinition): boolean =>
    definition.type === undefined || TEXT_TYPES.has(definition.type);

const isComposite = (definition: InputDefinition): boolean =>
    Array.isArray(definition.fields) && definition.fields.length > 0;

/** Has a source in captured data at all — a `newTab` boolean never does. */
const isDerivable = (definition: InputDefinition): boolean =>
    isComposite(definition) ||
    isUrlField(definition) ||
    isImageField(definition) ||
    isAltField(definition) ||
    isTextField(definition);

/** Cursors over one container's harvested primitives, so each is consumed at most once per item. */
interface Cursors {
    links: ReturnType<typeof collectLinks>;
    images: ReturnType<typeof collectImages>;
    texts: string[];
    linkAt: number;
    imageAt: number;
    textAt: number;
}

const cursorsFor = (node: CapturedNode, claimed: ReadonlySet<CapturedNode>): Cursors => ({
    links: collectLinks(node, claimed),
    images: collectImages(node, claimed),
    texts: collectPlainTexts(node, claimed),
    linkAt: 0,
    imageAt: 0,
    textAt: 0
});

/**
 * Can this container supply the item's fields?
 *
 * Only the fields that have a source in captured data are considered — a boolean like `newTab` is
 * never derivable, so requiring it would reject every candidate. A group qualifies when it can fill
 * at least one derivable field for each of its members, which is what separates a footer's five
 * columns (heading + links each) from its three rows.
 */
const satisfies = (
    node: CapturedNode,
    fields: InputDefinition[],
    claimed: ReadonlySet<CapturedNode>
): boolean => {
    const cursors = cursorsFor(node, claimed);
    let derivable = 0;
    let supplied = 0;

    for (const field of fields) {
        if (isComposite(field)) {
            derivable++;
            if (
                siblingGroups(node, claimed).some(group =>
                    satisfies(group.nodes[0]!, field.fields!, claimed)
                )
            ) {
                supplied++;
            }
            continue;
        }
        if (isUrlField(field)) {
            derivable++;
            if (cursors.links.length > 0) {
                supplied++;
            }
            continue;
        }
        if (isImageField(field)) {
            derivable++;
            if (cursors.images.length > 0) {
                supplied++;
            }
            continue;
        }
        if (isTextField(field)) {
            derivable++;
            if (cursors.texts.length > 0 || cursors.links.length > 0) {
                supplied++;
            }
        }
    }

    return derivable > 0 && supplied === derivable;
};

/** The containers that represent one list's items. */
const itemContainers = (
    node: CapturedNode,
    fields: InputDefinition[],
    claimed: ReadonlySet<CapturedNode>
): CapturedNode[] => {
    const viable = siblingGroups(node, claimed).filter(group =>
        group.nodes.every(member => satisfies(member, fields, claimed))
    );

    /*
     * A list wants repetition, so a group of one is only a fallback.
     *
     * Without this the winner is always a wrapper: a single `div` enclosing the whole footer contains
     * every heading and every link, so it outscores the five columns it wraps and yields ONE item
     * whose nested list then becomes the columns. Requiring at least two members discards the
     * wrapper chain, and the fallback still covers a genuine list of one.
     */
    const repeated = viable.filter(group => group.nodes.length > 1);
    const candidates = repeated.length > 0 ? repeated : viable;

    if (candidates.length === 0) {
        return [];
    }

    /*
     * Rank by how much of the section each grouping explains, not by how many members it has.
     *
     * Size alone picks the wrong thing on a real footer: one column's seven list items outnumber the
     * five columns, so `columns` came back as seven single-link items whose "headings" were link
     * labels. The five columns collectively account for every heading and all twenty-one
     * destinations, so coverage separates them decisively. Depth then favours the outer grouping when
     * two explain the same content (`li` and the `a` inside it), and size is the last tiebreak.
     */
    const scored = candidates.map(group => ({
        group,
        score: group.nodes.reduce((total, member) => total + coverage(member, claimed), 0)
    }));

    scored.sort(
        (a, b) =>
            b.score - a.score ||
            a.group.depth - b.group.depth ||
            b.group.nodes.length - a.group.nodes.length
    );

    return scored[0]!.group.nodes;
};

/** Fill one item's fields from its own container. */
const buildItem = (
    node: CapturedNode,
    fields: InputDefinition[],
    claimed: Set<CapturedNode>
): Record<string, unknown> => {
    const cursors = cursorsFor(node, claimed);
    const item: Record<string, unknown> = {};

    for (const field of fields) {
        if (isComposite(field)) {
            const nested = deriveList(node, field, claimed);
            if (nested.length > 0) {
                item[field.name] = nested;
            }
            continue;
        }

        if (isUrlField(field)) {
            const link = cursors.links[cursors.linkAt];
            if (link) {
                cursors.linkAt++;
                item[field.name] = link.href;
            }
            continue;
        }

        /*
         * Alt before image, because `imageAlt` satisfies both tests and the image test is the
         * broader one. It reads the image the previous field consumed rather than advancing the
         * cursor: `{ image, imageAlt }` describes ONE picture.
         */
        if (isAltField(field)) {
            const image = cursors.images[Math.max(0, cursors.imageAt - 1)];
            if (image?.alt) {
                item[field.name] = image.alt;
            }
            continue;
        }

        if (isImageField(field)) {
            const image = cursors.images[cursors.imageAt];
            if (image) {
                cursors.imageAt++;
                item[field.name] = image.src;
            }
            continue;
        }

        if (isTextField(field)) {
            // A plain text run first; a link's own label when the container is a link and has no
            // other text, which is the `{ label, url }` pair every navigation reduces to.
            const text = cursors.texts[cursors.textAt];
            if (text !== undefined) {
                cursors.textAt++;
                item[field.name] = text;
                continue;
            }
            const link = cursors.links[cursors.linkAt];
            if (link?.text) {
                item[field.name] = link.text;
            }
        }
    }

    return item;
};

const PLACEHOLDER_DESTINATIONS = new Set(["", "#", "/", "javascript:void(0)"]);

/**
 * Does a generated default list contain an item whose destination goes nowhere?
 *
 * Checked recursively, because the dead link is usually nested — a footer's placeholder hrefs sit at
 * `columns[].links[].url`, not on the top-level item.
 */
const hasPlaceholderDestination = (value: unknown, definition: InputDefinition): boolean => {
    if (!Array.isArray(value)) {
        return false;
    }

    return value.some(item => {
        if (typeof item !== "object" || item === null) {
            return false;
        }
        const record = item as Record<string, unknown>;

        return (definition.fields ?? []).some(field => {
            if (isComposite(field)) {
                return hasPlaceholderDestination(record[field.name], field);
            }
            if (!isUrlField(field)) {
                return false;
            }
            const destination = record[field.name];
            return (
                typeof destination === "string" && PLACEHOLDER_DESTINATIONS.has(destination.trim())
            );
        });
    });
};

/** Derive one list input's items, claiming the containers it consumes. */
const deriveList = (
    node: CapturedNode,
    definition: InputDefinition,
    claimed: Set<CapturedNode>
): Record<string, unknown>[] => {
    const fields = definition.fields ?? [];
    const containers = itemContainers(node, fields, claimed);
    if (containers.length === 0) {
        return [];
    }

    // Claim before building, so a nested list inside an item cannot re-select its own container.
    for (const container of containers) {
        claimed.add(container);
    }

    const items = containers
        .map(container => buildItem(container, fields, claimed))
        .filter(item => Object.keys(item).length > 0);

    /*
     * A single container means no repetition was found and this is the fallback, which is where
     * over-eager derivation shows up: a section holding one paragraph satisfies `{ label, value }`
     * on the strength of having some text, and comes back as one item with `label` set and `value`
     * missing — prose recast as a statistic.
     *
     * So a fallback item has to be complete. `alt` is exempt, since an image legitimately may not
     * carry one, and nested lists are exempt because emptiness there is a real answer.
     */
    if (containers.length === 1) {
        const required = fields.filter(
            field => !isComposite(field) && !isAltField(field) && isDerivable(field)
        );
        const complete = items.every(item => required.every(field => field.name in item));
        if (!complete) {
            return [];
        }
    }

    return items;
};

/**
 * Values for a component's list and composite inputs, derived element-wise from one instance's
 * captured section.
 *
 * Scalars are not touched here — those come from the representative-aligned text derivation, which
 * already works. This fills the half that used to fall back to the generated defaults, so a migrated
 * footer carries the page's own columns and destinations instead of `href: "#"` placeholders.
 *
 * Inputs are processed in MANIFEST ORDER and each claims the containers it consumes, because the
 * alternative is every link-shaped list selecting the same largest group: a footer's `socialLinks`
 * would take the widest column of nav links while the real social row went unused. Order plus
 * claiming resolves that deterministically without needing to understand what a "social link" is.
 */
export const deriveCompositeInputs = (params: {
    node: CapturedNode;
    manifest: ComponentManifest;
}): Record<string, unknown> => {
    const { node, manifest } = params;
    const claimed = new Set<CapturedNode>();
    const values: Record<string, unknown> = {};

    for (const input of manifest.inputs ?? []) {
        const definition = asDefinition(input);

        if (definition.list && isComposite(definition)) {
            const items = deriveList(node, definition, claimed);
            if (items.length > 0) {
                values[definition.name] = items;
                continue;
            }

            /*
             * Nothing to derive, so the generated default would stand. Keep it only if it does not
             * carry dead destinations.
             *
             * webiny.com's footer is the case: its social links ARE one of the five columns, so
             * `socialLinks` has no separate source, and the model's two example entries — `href: "#"`
             * — would render as links that go nowhere. A nav item that does nothing is worse on a demo
             * than an absent one, and worse than the honest empty list this leaves instead.
             *
             * Illustrative defaults without destinations (a features grid, a stat row) are left
             * alone: they read as content, not as broken navigation.
             */
            if (
                hasPlaceholderDestination(manifest.defaults?.inputs?.[definition.name], definition)
            ) {
                values[definition.name] = [];
            }
            continue;
        }

        // A single composite — a lone CTA, one image with its alt — is one item's worth of fields
        // read straight off the section, with no container selection to do.
        if (isComposite(definition)) {
            const item = buildItem(node, definition.fields ?? [], claimed);
            if (Object.keys(item).length > 0) {
                values[definition.name] = item;
            }
            continue;
        }

        // A list of scalars: the harvested primitives in order, which covers a list of links or of
        // plain strings without any per-item structure to align.
        if (definition.list) {
            if (isUrlField(definition)) {
                const hrefs = collectLinks(node).map(link => link.href);
                if (hrefs.length > 0) {
                    values[definition.name] = hrefs;
                }
            } else if (isTextField(definition)) {
                const texts = collectPlainTexts(node);
                if (texts.length > 0) {
                    values[definition.name] = texts;
                }
            }
        }
    }

    return values;
};
