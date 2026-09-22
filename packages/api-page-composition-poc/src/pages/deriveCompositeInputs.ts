import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";
import { isCredibleDestination, type DestinationContext } from "~/pages/isCredibleDestination.js";
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

/** Does this node supply one field? */
const supplies = (
    node: CapturedNode,
    field: InputDefinition,
    claimed: ReadonlySet<CapturedNode>
): boolean => {
    if (isComposite(field)) {
        // Some grouping beneath this node must satisfy the nested fields IN FULL. Accepting "supplies
        // any one of them" lets a bare paragraph pass as having a list of links.
        return siblingGroups(node, claimed).some(group =>
            groupSatisfies(group.nodes, field.fields ?? [], claimed)
        );
    }
    const cursors = cursorsFor(node, claimed);
    if (isUrlField(field)) {
        return cursors.links.length > 0;
    }
    if (isImageField(field) || isAltField(field)) {
        return cursors.images.length > 0;
    }
    if (isTextField(field)) {
        return cursors.texts.length > 0 || cursors.links.length > 0;
    }
    return false;
};

/**
 * Is this grouping the item list? Every member must supply every field that has a source.
 *
 * Judging this per member rather than across the group is deliberate, and was re-learned the hard
 * way. Relaxing it to "each member contributes something, the group covers everything" admits a
 * footer's three ROWS — one row holding the columns and therefore almost all the content — which
 * then wins on coverage and collapses five columns into three mismatched items.
 *
 * The cost is that a navigation mixing anchors with dropdown `<button>`s selects only its anchors,
 * so the triggers are dropped rather than carried as label-only items. For a migrated nav that is
 * the better failure: four real links beat seven items whose labels and destinations disagree.
 */
const groupSatisfies = (
    nodes: CapturedNode[],
    fields: InputDefinition[],
    claimed: ReadonlySet<CapturedNode>
): boolean => {
    const derivable = fields.filter(isDerivable);
    if (derivable.length === 0) {
        return false;
    }
    return nodes.every(node => derivable.every(field => supplies(node, field, claimed)));
};

/** The containers that represent one list's items. */
const itemContainers = (
    node: CapturedNode,
    fields: InputDefinition[],
    claimed: ReadonlySet<CapturedNode>
): CapturedNode[] => {
    const viable = siblingGroups(node, claimed).filter(group =>
        groupSatisfies(group.nodes, fields, claimed)
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
            /*
             * A plain text run first, then the link's own label.
             *
             * That order matters and was briefly inverted: preferring the link's label whenever the
             * container held exactly one link made a footer column headed "Legal" with a single
             * "Privacy" link come out headed "Privacy". A container's own text is its heading; the
             * link's label is only the right answer when the container IS the link, which is exactly
             * when there is no plain text to take.
             */
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

/**
 * Does a generated default list carry a destination that goes nowhere?
 *
 * Checked recursively, because the dead link is usually nested — a footer's placeholder hrefs sit at
 * `columns[].links[].url`, not on the top-level item.
 */
const hasDeadDestination = (
    value: unknown,
    definition: InputDefinition,
    context: DestinationContext
): boolean => {
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
                return hasDeadDestination(record[field.name], field, context);
            }
            if (!isUrlField(field)) {
                return false;
            }
            const destination = record[field.name];
            return typeof destination === "string" && !isCredibleDestination(destination, context);
        });
    });
};

/**
 * The smallest unclaimed node that can stand for one composite value.
 *
 * Prefers a node carrying a destination when the composite wants one, and the deepest such node so a
 * logo anchor is chosen over the bar that contains it. Returns undefined when nothing qualifies, and
 * the caller then reads the section as a whole.
 */
const compositeContainer = (
    node: CapturedNode,
    fields: InputDefinition[],
    claimed: ReadonlySet<CapturedNode>
): CapturedNode | undefined => {
    const wantsUrl = fields.some(isUrlField);
    let best: { node: CapturedNode; depth: number } | undefined;

    const visit = (current: CapturedNode, depth: number): void => {
        if (claimed.has(current)) {
            return;
        }
        if (current !== node) {
            /*
             * For a composite that wants a destination, carrying exactly one link is the whole
             * qualification — the other fields are not required.
             *
             * Demanding all of them found nothing on a real header: its `logo` is
             * `{ href, label, image { alt } }` and the logo mark is an `<svg>`, so `image.alt` can
             * never be satisfied and selection fell back to the whole section, where `logo`,
             * `actions` and `socialProof` each ate the same first link and borrowed a stray label.
             *
             * Localising on the link alone leaves the unfillable fields ABSENT, which is the honest
             * answer: this logo genuinely has no text label.
             */
            const ownLinks = collectLinks(current, claimed);
            const usable = wantsUrl
                ? ownLinks.length === 1
                : ownLinks.length === 0 && groupSatisfies([current], fields, claimed);
            if (usable && (!best || depth > best.depth)) {
                best = { node: current, depth };
            }
        }
        for (const child of current.children) {
            visit(child, depth + 1);
        }
    };

    visit(node, 0);
    return best?.node;
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
    /** The page this instance came from, to tell an invented same-host URL from a captured one. */
    sourceUrl: string;
}): Record<string, unknown> => {
    const { node, manifest } = params;
    const claimed = new Set<CapturedNode>();
    const values: Record<string, unknown> = {};

    let sourceHost = "";
    try {
        sourceHost = new URL(params.sourceUrl).host;
    } catch {
        sourceHost = "";
    }
    const context = {
        captured: new Set(collectLinks(node).map(link => link.href)),
        sourceHost
    };

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
                hasDeadDestination(
                    manifest.defaults?.inputs?.[definition.name],
                    definition,
                    context
                )
            ) {
                values[definition.name] = [];
            }
            continue;
        }

        /*
         * A single composite — a logo, a lone CTA, one image with its alt — gets its OWN container
         * rather than reading the whole section, and claims it.
         *
         * Reading from the section root meant every such input consumed the same first link: a header
         * with `logo`, `actions` and `socialProof` came out with all three pointing at the logo's
         * destination and sharing one stray label. Localising them walks the section in document
         * order instead, which is the order a reader would pair them in.
         */
        if (isComposite(definition)) {
            const fields = definition.fields ?? [];
            const container = compositeContainer(node, fields, claimed) ?? node;
            if (container !== node) {
                claimed.add(container);
            }
            const item = buildItem(container, fields, claimed);
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
