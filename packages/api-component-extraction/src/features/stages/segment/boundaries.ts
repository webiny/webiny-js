import type { Box, CapturedNode } from "~/domain/artifacts.js";
import { paintedBox } from "./paintedBox.js";

/**
 * Why a child of a section was not taken as a boundary of its own.
 *
 * `too-short` and `too-narrow` are the child's own doing — it does not look like a section. The other
 * two are the parent's: the child was section-shaped, and the parent was still kept whole.
 */
export type CandidateRejection =
    | "too-short"
    | "too-narrow"
    | "parent-below-max-height"
    | "too-few-siblings"
    | "children-overlap"
    | "positioned-overlay";

/**
 * A child boundary the segmenter evaluated inside a section and did not take.
 *
 * Retained because a split correction should be a choice between boundaries the segmenter already
 * computed, not a drawing exercise: the operator picks one of these, and the same list makes the
 * choice reattachable on a later run.
 */
export interface SectionCandidate {
    box: Box;
    /** Position among the parent's considered children — the handle a split override keys on, so it
     * survives a capture at a slightly different page height. */
    index: number;
    tag: string;
    /** Why it was not taken. */
    rejection: CandidateRejection;
    /**
     * Whether splitting here would produce two sections worth having. A boundary a few pixels from the
     * section's top or bottom shaves off a sliver rather than dividing it, so both resulting parts must
     * clear the same height floor that decides whether anything is a section at all.
     */
    offerable: boolean;
}

/** A detected section boundary before its crop is produced (Segment attaches `cropRef`). */
export interface DetectedSection {
    box: Box;
    /** Where the section paints, when that reaches past its box; the crop is taken from it. */
    cropBox?: Box;
    index: number;
    /** The child boundaries considered inside this section and rejected (W11.1). */
    candidates: SectionCandidate[];
}

export interface SegmentOptions {
    /**
     * A section must be at least this tall (px) — filters out thin dividers, spacer rows and stray
     * link strips. A semantic landmark (`header`, `nav`, `footer`) is exempt: it is page furniture a
     * migration has to carry, and it is usually shorter than this.
     */
    minHeight: number;
    /** …and at least this fraction of the viewport wide — filters out sidebars and controls. */
    minWidthRatio: number;
    viewportWidth: number;
    /**
     * A near-full-width block taller than this that is really a vertical stack of several full-width
     * children is treated as a CONTAINER and split into those children, rather than taken whole as one
     * section. This is what stops a single page-wrapping element (a `<main>` / content `<div>`) from
     * swallowing the whole page as one giant section.
     */
    maxSectionHeight: number;
    /** How many stacked full-width children make a block a container to split (at least this many). */
    minChildrenToSplit: number;
}

/**
 * Descend through single-dominant-child wrapper nodes (`<div id="root"><div class="app">…`) to the real
 * content root, so sections are the page's actual top-level blocks rather than one giant wrapper.
 */
export const findContentRoot = (node: CapturedNode): CapturedNode => {
    let current = node;
    while (
        current.children.length === 1 &&
        current.children[0].box.height >= 0.9 * current.box.height
    ) {
        current = current.children[0];
    }
    return current;
};

/**
 * Landmarks that are a section whatever their height.
 *
 * The height floor exists to discard thin noise, and it was documented as filtering out "headers,
 * nav bars, links" — which is exactly wrong for a migration. A site header is typically 60–90px, so
 * the floor silently dropped the page's navigation: webiny.com's `<header>` was captured with five
 * links and never became a section, so no component was ever generated for it and no migrated page
 * had a nav.
 *
 * These three tags say what the block IS, which is a far better signal than its height. Anything
 * they admit that an operator does not want is one exclude at the Cluster gate.
 */
const LANDMARK_TAGS = new Set(["header", "nav", "footer"]);

/** A background that paints nothing — `transparent`, or any colour at zero alpha. */
const isTransparent = (value: string | undefined): boolean =>
    !value || value === "transparent" || /rgba\([^)]*,\s*0(\.0+)?\s*\)/i.test(value);

const hasText = (node: CapturedNode): boolean => {
    const own = (node.textRuns ?? (node.text ? [node.text] : [])).join("").trim();
    return own.length > 0 || (node.children ?? []).some(hasText);
};

/**
 * A utility band: a strip that declares itself a distinct block by painting its own background.
 *
 * The same argument as `LANDMARK_TAGS`, by a different signal. A site's phone/address bar is 31–57px
 * and the height floor is 120, so it is never a section — and the consequence is not that it is
 * merged tidily into its neighbour. Measured on one eight-page run, the same green
 * `475-334-1114 | 1070 Main St Bridgeport` bar was **absorbed into the block below it on three pages
 * and dropped into no section at all on the other five**, because that depended only on whether its
 * parent happened to clear `maxSectionHeight`. A dropped band leaves no trace: candidates are
 * recorded only for sections kept whole, so five pages lost their contact bar with nothing in the
 * artifact to say so.
 *
 * Three conditions together, because each one alone admits noise. Full width without a background is
 * a spacer row; a background without text is a divider or a rule; text without full width is a
 * control. All three is a page-level band.
 *
 * Shortness is part of the definition, not an accident of where it is used. This is an exemption from
 * the height floor, so it must only describe nodes the floor would otherwise reject — without that,
 * the container relaxation below fires on ordinary tall sections and splits pages that were right.
 */
const isDeclaredBand = (node: CapturedNode, options: SegmentOptions): boolean =>
    node.box.height < options.minHeight &&
    !LANDMARK_TAGS.has(node.tag) &&
    !isTransparent(node.styles?.backgroundColor) &&
    node.box.width >= options.minWidthRatio * options.viewportWidth &&
    hasText(node);

/**
 * A node big enough to be a section rather than a control: near-full-width, and either tall enough,
 * a landmark, or a band that declares itself one.
 *
 * The width requirement still applies to landmarks, so a narrow in-page `<nav>` (a table of
 * contents, a breadcrumb rail in a sidebar) is not promoted to a section.
 */
const isSectionCandidate = (node: CapturedNode, options: SegmentOptions): boolean =>
    (node.box.height >= options.minHeight ||
        LANDMARK_TAGS.has(node.tag) ||
        isDeclaredBand(node, options)) &&
    node.box.width >= options.minWidthRatio * options.viewportWidth;

/**
 * Page furniture the browser paints over the content instead of stacking above it.
 *
 * A `position: fixed` or `sticky` header has a box at the top of the document and a `<main>` that also
 * starts at the top, so by geometry alone they overlap — and the stack test is all-or-nothing, so that
 * single pair disqualifies every other sibling. One site in the five-site collection lost its entire
 * segmentation to this: nine pages, nine sections, two components, because one sticky header overlapped
 * the content on every page.
 *
 * Narrowed to the three landmarks on purpose. Any absolutely positioned decoration could be excluded on
 * the same geometric argument, but `header`/`nav`/`footer` are the elements that are actually pinned in
 * practice, and reading what the page declared beats inferring it from boxes that can be wrong for a
 * stacked child of an oversized parent or a modal captured open.
 */
const OVERLAY_POSITIONS = new Set(["fixed", "sticky"]);

const isPositionedOverlay = (node: CapturedNode): boolean =>
    LANDMARK_TAGS.has(node.tag) && OVERLAY_POSITIONS.has(node.styles?.position ?? "");

/**
 * Whether these blocks are stacked vertically (each begins at or below the previous one's bottom) rather
 * than layered on top of each other. A container of sections is a vertical stack; a hero's background and
 * content layers overlap, so they are not — which keeps a hero from being mistaken for a container and
 * split apart.
 */
const areVerticallyStacked = (children: CapturedNode[]): boolean => {
    const sorted = [...children].sort((a, b) => a.box.y - b.box.y);
    for (let i = 1; i < sorted.length; i++) {
        const previous = sorted[i - 1];
        const overlap = previous.box.y + previous.box.height - sorted[i].box.y;
        if (overlap > 0.5 * previous.box.height) {
            return false;
        }
    }
    return true;
};

/** A section as it leaves detection: the node it came from, plus the boundaries it declined to take. */
interface CollectedSection {
    node: CapturedNode;
    candidates: SectionCandidate[];
}

/**
 * The boundaries this section considered and did not take, with the reason for each.
 *
 * `parentRejection` is why the parent was kept whole, which is the reason that applies to every child
 * that was section-shaped; a child that was not section-shaped carries its own reason instead.
 */
const rejectedCandidates = (
    inner: CapturedNode,
    options: SegmentOptions,
    parentRejection: CandidateRejection
): SectionCandidate[] =>
    inner.children.map((child, index) => {
        const tooNarrow = child.box.width < options.minWidthRatio * options.viewportWidth;
        const tooShort = !(
            child.box.height >= options.minHeight ||
            LANDMARK_TAGS.has(child.tag) ||
            isDeclaredBand(child, options)
        );
        /*
         * An overlay says so for itself, so a section kept whole records which child was set aside
         * from the stack decision — a later collapse of this shape reads its cause off the artifact
         * instead of needing the decision re-run over the trees to find it.
         */
        const rejection: CandidateRejection = tooNarrow
            ? "too-narrow"
            : tooShort
              ? "too-short"
              : isPositionedOverlay(child)
                ? "positioned-overlay"
                : parentRejection;

        /*
         * Both halves have to be worth having. A child whose top edge sits a few pixels below the
         * section's own top divides off a sliver, not a block — measured on a real run, a boundary
         * 24px into a 713px section was being offered as a split.
         */
        const above = child.box.y - inner.box.y;
        const below = inner.box.y + inner.box.height - child.box.y;
        const divides = above >= options.minHeight && below >= options.minHeight;

        return {
            box: child.box,
            index,
            tag: child.tag,
            rejection,
            offerable: !tooNarrow && !tooShort && divides
        };
    });

/**
 * Resolve one candidate into section leaves. To decide whether the candidate is really a container of
 * sections, descend through single full-height wrappers (`<main><div class="container">…`) to reach where
 * its section-level children actually live — this also finds sections nested under a centred max-width
 * container. If that inner node is a tall vertical stack of several full-width children, the candidate is
 * a container: recurse into each child. Otherwise the candidate is itself one section, emitted with its
 * own (widest) box — so a plain section keeps its full-width box rather than collapsing to an inner column.
 *
 * When the candidate is kept whole, the children it declined to split at are retained with the reason,
 * so a later correction chooses among boundaries the segmenter already computed.
 */
const collectSections = (
    candidate: CapturedNode,
    out: CollectedSection[],
    options: SegmentOptions
): void => {
    const inner = findContentRoot(candidate);
    const children = inner.children.filter(child => isSectionCandidate(child, options));
    /*
     * The stack test asks whether the children sit one below another. A pinned landmark does not, by
     * construction, so it is set aside for that question only — it stays in `children`, and therefore
     * still becomes a section of its own when the split goes ahead.
     *
     * A node with a derived box is set aside for the same question, for a different reason: its box was
     * inferred from its children rather than measured, because the element reported zero area while
     * rendering content. An inference about extent should not be allowed to veto a decision about where
     * measured siblings sit — that gives a guess authority over a measurement. Such a node is still a
     * section in its own right; it simply does not get a vote on whether its siblings stack.
     *
     * Without this, recovering a zero-area wrapper defeats the very segmentation it was recovered for:
     * an absolutely positioned header, repaired to a box spanning y=0..255, overlaps the content block
     * that also begins at y=0, the all-or-nothing stack test fails, and the page is emitted as one
     * section instead of six.
     */
    const stackable = children.filter(child => !isPositionedOverlay(child) && !child.boxDerived);
    const stacked = areVerticallyStacked(stackable);
    const enoughChildren = children.length >= options.minChildrenToSplit;
    /*
     * `maxSectionHeight` asks "is this block big enough to be a container rather than a section", and
     * height is a poor proxy when one of the children is a band. A 627px block made of a 57px contact
     * bar above a 570px content block is a container, and its height does not say so — measured, that
     * exact block was emitted as one section with the bar glued to the top of the portal beneath it.
     *
     * A band among the children settles it directly: a block holding something that declares itself a
     * separate band is holding at least two things.
     */
    const holdsBand = children.some(child => isDeclaredBand(child, options));
    const tallEnough = inner.box.height > options.maxSectionHeight || holdsBand;

    if (enoughChildren && tallEnough && stacked) {
        for (const child of children) {
            collectSections(child, out, options);
        }
        return;
    }

    // Which of the three conditions kept this one whole — the reason its children were not taken.
    const parentRejection: CandidateRejection = !enoughChildren
        ? "too-few-siblings"
        : !tallEnough
          ? "parent-below-max-height"
          : "children-overlap";

    out.push({
        node: candidate,
        candidates: rejectedCandidates(inner, options, parentRejection)
    });
};

/**
 * The page's real content sections. Starting from the content root, each near-full-width, tall-enough
 * direct child is a candidate; a candidate that is itself a vertical stack of several full-width sections
 * is recursively split into them (so one page-wrapping element does not swallow the page as a single
 * block), while a self-contained block — a hero, a footer — is kept whole. Boxes are in document
 * coordinates, i.e. into the full-page screenshot, so a crop is taken from the PNG without a second visit.
 */
export const detectSections = (root: CapturedNode, options: SegmentOptions): DetectedSection[] => {
    const contentRoot = findContentRoot(root);
    const out: CollectedSection[] = [];
    for (const child of contentRoot.children) {
        if (isSectionCandidate(child, options)) {
            collectSections(child, out, options);
        }
    }
    return out.map((section, index) => {
        const painted = paintedBox(section.node, options.viewportWidth);
        return {
            box: section.node.box,
            ...(painted ? { cropBox: painted } : {}),
            index,
            candidates: section.candidates
        };
    });
};
