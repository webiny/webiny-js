/**
 * The artifact contracts each stage reads and writes. Stages hand off by reference (a key on the
 * ledger); these are the shapes behind those keys. Kept in one place so every stage agrees on them.
 */

// ----- Discover ----------------------------------------------------------------------------------

/**
 * Which source produced a URL. `both` is the healthy case — the sitemap claims the page and the crawl
 * reached it. `sitemap` alone means the crawl never reached it: either an orphan page nothing links to,
 * or a stale entry, and the operator is the one who can tell which.
 */
export type UrlSource = "sitemap" | "crawl" | "both" | "manual";

/** What resolving a URL returned. A null status means the request never completed at all. */
export interface UrlResolution {
    status: number | null;
    /** True for a 2xx after redirects, on this site — the only case worth capturing. */
    ok: boolean;
    /** Where the URL landed, when a redirect moved it. */
    finalUrl?: string;
    /**
     * The URL redirected to another site. It answers, often with a 200, but what answers is not a page
     * of this site — a `/github` that lands on github.com. Capturing it would put someone else's page
     * in the run under a local URL, so it is excluded with this as the reason rather than a status.
     */
    offSite?: boolean;
}

export interface DiscoveredUrl {
    url: string;
    /** The path-prefix group this URL was sampled from (e.g. "blog", "root"). */
    group: string;
    /** The page's <title>, read at discovery; null when unavailable. */
    title?: string | null;
    /** Which source produced this URL — the provenance the gate shows per row. */
    source: UrlSource;
    /** The resolve check. Absent on a manually added URL, which is taken on the operator's word. */
    resolution?: UrlResolution;
}

/**
 * What each source claimed, so the operator can see a sitemap disagreeing with the site before capture
 * rather than after generation.
 *
 * A sitemap claiming 40 pages when the crawl found 9 is the signal that matters: it is either 31 orphan
 * pages or a sitemap the CMS generates wrongly, and the counts here are what tells them apart.
 */
export interface DiscoverySummary {
    /**
     * `absent` — no sitemap fetched. `not-sitemap` — something was served but it is not a sitemap (an
     * HTML error page returned with a 200 is the usual culprit). `empty` and `root-only` — a valid
     * sitemap carrying nothing usable, which is treated exactly as if there were none. `used` — it
     * contributed URLs.
     */
    sitemapStatus: "absent" | "not-sitemap" | "empty" | "root-only" | "used";
    /** Raw `<loc>` count across the sitemap and any child sitemaps, before validation. */
    sitemapClaimed: number;
    /** Entries dropped for pointing at another host. */
    sitemapOffHost: number;
    /** Entries dropped for not addressing a page at all (a nested sitemap, a PDF, an image). */
    sitemapNonPage: number;
    /** Entries that resolved to a non-2xx, or did not resolve at all. */
    sitemapUnresolved: number;
    /** Distinct pages the sitemap actually contributed, after validation and folding. */
    sitemapUsable: number;
    /** Distinct pages the link crawl found. */
    crawled: number;
    /** How deep the crawl went from the entry page. */
    crawlDepth: number;
    /**
     * The crawl stopped with links still to follow — its request ceiling, or the stage's clock. Carried
     * on the artifact rather than only as a degradation note, because the gate reads the artifact and
     * "the crawl did not finish" changes how the counts beside it should be read.
     */
    crawlTruncated: boolean;
    /** The sitemap listed more entries than this stage carries, so its tail was not considered. */
    sitemapTruncated: boolean;
    /**
     * Distinct pages across both sources that resolved — what could be captured, before the page cap.
     * A sitemap claiming 40 while this reads 9 is the reading the operator needs, with the difference
     * accounted for by `sitemapUnresolved` and the `unresolved` list.
     */
    union: number;
    /** Union entries the page cap left out. */
    overCap: number;
}

export interface DiscoverArtifact {
    entryUrl: string;
    /** What each source claimed and what came of it (§ the Discover gate's summary line). */
    discovery: DiscoverySummary;
    /** The distinct path-prefix groups discovered, for reporting. */
    groups: string[];
    /** The sampled URL list, at most the job's page cap, spread across groups. */
    urls: DiscoveredUrl[];
    /**
     * Discovered but deliberately not included: the URL did not resolve, or it resolved onto another
     * site. Kept so the gate can show a dead sitemap entry instead of silently dropping it, but out of
     * `urls` because capturing an error page feeds garbage sections into clustering and spends the
     * page cap doing it.
     */
    unresolved: DiscoveredUrl[];
}

// ----- Capture (contract; the browser handler lands in batch 2) ----------------------------------

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * A pruned element node: tag, geometry, a computed-style subset (the token-relevant properties), any
 * direct text, and children. This is the working artifact segmentation and clustering operate on — not
 * the raw DOM, which is a separate compressed cold artifact.
 */
export interface CapturedNode {
    tag: string;
    box: Box;
    /** Token-relevant computed styles (background, color, font, spacing, radius…). */
    styles: Record<string, string>;
    /** Direct text content, for the text-preservation validator. Absent if the node has none. */
    text?: string;
    /**
     * The runs `text` was joined from, present only when an inline element interrupted them.
     *
     * `text` concatenates an element's direct text children, so a paragraph with a link in the middle
     * yields one string containing the text either side of the link glued together — a fragment the
     * page never displays. Where that happened, these are the pieces that were actually rendered, and
     * they are what the section digest turns into checkable fragments.
     */
    textRuns?: string[];
    /**
     * A link's destination, absolute (the evaluator reads the DOM property, so the browser has already
     * resolved it). Present on `a`/`area` only.
     *
     * Content, not tuning: without it a migrated navigation has labels and no destinations, and the
     * compressed raw DOM is deliberately a short-lived tuning artifact that must not become
     * load-bearing.
     */
    href?: string;
    /** A media node's source, absolute. Present on `img`/`source`/`video`/`iframe`/`embed` only. */
    src?: string;
    /** An image's alternative text. Present when the element carries a non-empty `alt`. */
    alt?: string;
    /**
     * This node's box was **inferred from its children** rather than measured, because the element
     * reported a zero-area rect while rendering content — an absolutely positioned header inside a
     * zero-height flex wrapper, a carousel track escaping its rail.
     *
     * The box is the union of the boxes of the children that survived, so it says where the content
     * is, not where the browser said the element was. Absent means the box was measured.
     *
     * It is not only a debugging aid. A derived box is an inference about extent, and Segment's
     * stacking test must not let an inference veto a decision about measured siblings — see
     * `areVerticallyStacked`.
     */
    boxDerived?: boolean;
    children: CapturedNode[];
}

/** Signals observed while a page was captured, surfaced as warnings on the Capture grid. */
export interface CaptureWarnings {
    /**
     * What the overlay pass found still covering the page after it ran, or `null` when it came back
     * clean. The pass reports this itself rather than a separate detector re-deciding it: it is the
     * code that did the clearing, so its answer and the page in the screenshot cannot disagree.
     */
    overlayRemains: string | null;
    /** Broken `<img>` elements (loaded, zero natural size) at capture time, and the total on the page. */
    brokenImages: number;
    totalImages: number;
}

/**
 * What one run of the overlay pass took off the page.
 *
 * Separated by how it went, because that is the question worth asking of a capture that looks wrong.
 * `hidden` is routine. `dismissed` means the overlay offered a way out and we took it. `removed` is
 * the one carrying risk — the capture acted against a page that offered nothing — so each entry
 * records the geometry that justified it, and it is the first thing to read when a section is missing.
 */
export interface OverlayPass {
    hidden: string[];
    dismissed: string[];
    removed: string[];
    unlockedScroll: boolean;
}

/**
 * Both runs of the pass, kept apart rather than summed.
 *
 * They clean different artifacts and the distinction is not cosmetic: `early` runs before the sampler,
 * so it decides what the element tree contains, and `late` runs immediately before the camera, so it
 * decides what the screenshot contains. An overlay only `late` caught was never in the tree but would
 * have been in the photograph; one only `early` caught is the reverse. Summing them would hide exactly
 * the thing worth knowing — whether one pass would have done.
 */
export interface OverlayClearance {
    early: OverlayPass;
    late: OverlayPass;
}

export interface CapturedPage {
    url: string;
    finalUrl: string;
    /** The page's `<title>`, so the capture grid reads by name rather than by path. */
    title: string;
    viewport: Box;
    documentHeight: number;
    /** Blob keys for this page's pruned tree, full-page desktop screenshot and compressed raw DOM. */
    treeRef: string;
    screenshotRef: string;
    rawDomRef: string;
    /** Full-page screenshot at the narrow width, for responsive inspection. */
    narrowScreenshotRef: string;
    /** A small downscaled derivative of the desktop screenshot, so the capture grid isn't tens of MB. */
    thumbnailRef: string;
    /** Capture-time warnings (a surviving overlay, broken images) for the visibility view. */
    warnings: CaptureWarnings;
    /** What the overlay pass hid, closed and removed on this page. */
    overlayClearance: OverlayClearance;
}

/** A page that could not be captured, with the reason (so the operator can tell why). */
export interface CaptureFailure {
    url: string;
    reason: string;
}

export interface CaptureArtifact {
    pages: CapturedPage[];
    /** Pages that could not be captured — degraded, not fatal — each with its failure reason. */
    failed: CaptureFailure[];
}

// ----- Segment -----------------------------------------------------------------------------------

/** A candidate section on a page: a bounding box into the full-page screenshot, plus where in the tree. */
/** Why a child boundary inside a section was not taken (W11.1). */
export type CandidateRejection =
    | "too-short"
    | "too-narrow"
    | "parent-below-max-height"
    | "too-few-siblings"
    | "children-overlap"
    /** A fixed or sticky landmark, set aside from the stack test rather than disqualifying it. */
    | "positioned-overlay";

/**
 * A boundary the segmenter evaluated inside a section and did not take.
 *
 * Retained so a split correction is a choice between boundaries the segmenter already computed rather
 * than a free-hand box, and so the same choice can be found again on a later run.
 */
export interface SectionCandidate {
    box: Box;
    /** Position among the parent's considered children — what a split override keys on. */
    index: number;
    tag: string;
    rejection: CandidateRejection;
    /** Whether splitting here would actually divide the section in two. */
    offerable: boolean;
}

export interface SectionBox {
    box: Box;
    /** Index of the section among the content root's children — a stable handle within the page. */
    index: number;
    /** Blob key of this section's cropped, downscaled image, produced by Segment from the screenshot. */
    cropRef: string;
    /** The child boundaries considered inside this section and rejected (W11.1). */
    candidates: SectionCandidate[];
}

export interface SegmentedPage {
    url: string;
    /**
     * The page's `<title>`, forwarded from Capture. Carried so a consumer that creates something per
     * page can name it what the page called itself instead of inferring a name from the URL.
     */
    title: string;
    /** The page's screenshot, so section crops come from it rather than a second visit. */
    screenshotRef: string;
    /** Forwarded from Capture so Cluster can read the section subtrees without reaching back. */
    treeRef: string;
    documentHeight: number;
    sections: SectionBox[];
}

export interface SegmentArtifact {
    pages: SegmentedPage[];
    /**
     * The section-container height this run used. Recorded on the artifact because it is tunable per
     * run: without it, two runs of the same job produce different section counts with nothing on
     * either artifact saying why.
     */
    maxSectionHeight: number;
}

// ----- Cluster (output) --------------------------------------------------------------------------

export interface ClusterMember {
    url: string;
    /** Index of the section on its page (into the content root's children). */
    sectionIndex: number;
    signature: string;
    /** Blob key of this member's section crop, so the cluster view can show every member. */
    cropRef: string;
    /**
     * Per-member detail carried so a `cluster.split`/`cluster.move` override (W8) can promote this member
     * into its own cluster and still be classified, planned and generated. Optional for backward
     * compatibility with artifacts written before W8; Cluster now populates them for every member.
     */
    digest?: SectionDigest;
    screenshotRef?: string;
    box?: Box;
}

/**
 * A compact, model-friendly summary of a section — carried forward from Cluster so Classify and Plan
 * work off it without re-loading the page trees.
 */
export interface SectionDigest {
    /** A shallow tag-structure summary, e.g. "section>h2,p,a". */
    structure: string;
    /** Direct/descendant text snippets, deduped and capped. */
    texts: string[];
    imageCount: number;
    linkCount: number;
    headingCount: number;
}

/** The representative section's reference image — the crop Segment produced, plus its source box. */
export interface RepresentativeCrop {
    screenshotRef: string;
    /** The section box in document coordinates (kept for reference/debugging). */
    box: Box;
    /** Blob key of the pre-made section crop Generate uses as its reference image. */
    cropRef: string;
}

export interface Cluster {
    signature: string;
    members: ClusterMember[];
    /** The first-seen member, used as the cluster's exemplar by Classify, Plan and Generate. */
    representative: ClusterMember;
    /** The representative section's digest. */
    digest: SectionDigest;
    /** Text observed across all members (deduped, capped) — the raw material for Plan's prop values. */
    observedTexts: string[];
    /** Where Generate crops the reference image for this cluster. */
    representativeCrop: RepresentativeCrop;
    /**
     * Set by a `cluster.exclude` override (W8): the cluster stays in the artifact (visible, muted, and
     * restorable in the UI) but downstream stages skip it. Absent/false on a machine-produced cluster.
     */
    excluded?: boolean;
}

/** One point on the threshold→cluster-count curve, for the threshold slider's live preview (W8.3). */
export interface ThresholdCurvePoint {
    threshold: number;
    clusters: number;
}

export interface ClusterArtifact {
    clusters: Cluster[];
    /** The similarity threshold this artifact was clustered at (W8.3); absent on pre-threshold artifacts. */
    threshold?: number;
    /** The highest similarity between any two clusters (0–1) — how close the nearest pair is. */
    nearestPair?: number;
    /** Cluster count across a grid of thresholds, so the slider previews the count without re-running. */
    thresholdCurve?: ThresholdCurvePoint[];
}

// ----- Classify (output) -------------------------------------------------------------------------

export interface ClassifiedCluster {
    /** The full cluster, carried forward so Plan has the digest and members without re-reading. */
    cluster: Cluster;
    /** A type from the taxonomy (e.g. "hero", "features", "cta"), or "unknown" when unclassified. */
    type: string;
    name: string;
    confidence: number;
    /** True when the model's confidence was below threshold — proceeds with a descriptive name. */
    unclassified: boolean;
}

export interface ClassifyArtifact {
    clusters: ClassifiedCluster[];
}

// ----- Plan (output) -----------------------------------------------------------------------------

/**
 * A model-proposed observation summary for one prop, feeding the Plan gate's "values observed" column.
 * These are estimates (the plan is a proposal), with one grounded field: `totalInstances` is stamped
 * server-side from the cluster's real member count, so "N of M" always has a true denominator.
 */
export interface PropObservation {
    /** How many instances included this prop (model estimate). */
    presentInstances?: number | null;
    /** Total instances in the cluster — grounded to the member count, not model-supplied. */
    totalInstances?: number | null;
    /** Array props only: fewest / most items seen per instance (model estimate). */
    countMin?: number | null;
    countMax?: number | null;
    /** Frequent literal values with their counts, most frequent first — e.g. `0.5 (4), 0.32 (2)`. */
    valueCounts?: { value: string; count: number }[] | null;
}

export interface ComponentProp {
    name: string;
    /**
     * The BASE type the model proposes — a scalar ("string" | "richText" | "url" | "number" | "boolean" |
     * "image"), a composite type name ("Link" | "Image" | "Point" | …), or an enum literal ("2 | 3 | 4").
     * The `?` / `[]` decorations are carried by `optional` / `array`, not baked into this string.
     */
    type: string;
    /** Optional prop — renders a trailing "?" and shifts phrasing to "present on N of M". */
    optional?: boolean;
    /** Array / repeated prop — renders "[]" and drives the "N–M per instance" / "per item" phrasing. */
    array?: boolean;
    /** Sub-fields for composite props (object, Link/Image/Point, array-of-object). Recursive, depth-capped. */
    fields?: ComponentProp[];
    /** Sample values observed across the cluster's members. */
    observedValues: string[];
    observation?: PropObservation;
}

export interface TokenBinding {
    /** Which prop or element the binding applies to (free-form; the model proposes it). */
    target: string;
    /** A manifest slot path / css variable name. */
    token: string;
}

export interface PlannedComponent {
    signature: string;
    name: string;
    type: string;
    props: ComponentProp[];
    tokenBindings: TokenBinding[];
    /** The representative member, so Generate can crop its reference image. */
    representative: ClusterMember;
    /** Every section this component covers, so Assemble can place its instances per page. */
    members: ClusterMember[];
    /** Where Generate crops the reference image. */
    representativeCrop: RepresentativeCrop;
    /** The section's text, for Generate's text-preservation validator. */
    sourceTexts: string[];
    /**
     * The operator's running list of "Regenerate props" instructions for this component, oldest first.
     * Fed back on every regenerate so the model keeps cumulative intent (e.g. a field the operator had
     * removed does not creep back in). Absent until the first steered regenerate.
     */
    refinements?: string[];
}

export interface PlanArtifact {
    components: PlannedComponent[];
}

// ----- Generate (output) -------------------------------------------------------------------------

/** The result of one W5 validator. Lives here (domain) so the pure validators depend on it. */
export interface ValidationResult {
    passed: boolean;
    failures: string[];
}

export interface GeneratedComponent {
    signature: string;
    name: string;
    type: string;
    /** The generated JSX source and CSS — held inside the job until Promote. */
    source: string;
    css: string;
    props: ComponentProp[];
    tokenBindings: TokenBinding[];
    members: ClusterMember[];
    /** How many generation attempts it took to pass validation. */
    attempts: number;
    validation: {
        /**
         * Whether the component bundles at all.
         *
         * Separate from the others on purpose. Text preservation is now checked against the component
         * rendered with its values, which means bundling it first — and a component that fails to
         * bundle would otherwise surface as "missing text: …" for every fragment, which is the wrong
         * diagnosis and the wrong remedy. A bundle failure is a code problem; a text failure is a
         * content problem.
         */
        bundling: ValidationResult;
        textPreservation: ValidationResult;
        contractConformance: ValidationResult;
        tokenBinding: ValidationResult;
    };
}

/**
 * One component's entry in the Generate aggregate: what a consumer can use *without* opening the
 * component, plus a reference to where the rest of it lives.
 *
 * The aggregate used to carry each `GeneratedComponent` whole. Its size then scaled with source and
 * with cluster membership — `members` grows with the number of pages a component appears on, not
 * with the number of components — and the aggregate is one DynamoDB item, capped at 400 KB. Measured
 * on real runs that put the ceiling near 12 components per run, which is below what most sites
 * produce.
 *
 * Measured at ~0.64 KB per entry in this shape, so the aggregate reaches 400 KB at roughly 600
 * components. Its size is now a function of component count alone.
 */
export interface GeneratedComponentRef {
    signature: string;
    name: string;
    type: string;
    /** How many generation attempts it took to pass validation. */
    attempts: number;
    /**
     * Counts, so a list can say "3 instances across 2 pages" without loading `members` or `props`.
     * `pageCount` is distinct member URLs — the number the Generate and Promote views show, and not
     * something `memberCount` yields, since a component can appear twice on one page.
     */
    memberCount: number;
    pageCount: number;
    propCount: number;
    /**
     * Carried whole rather than summarised. A consumer must see the same validator results before and
     * after this change, and the largest validation block measured is 446 bytes — so capping the
     * failure lists would alter what the admin shows and save nothing worth having.
     */
    validation: {
        /**
         * Whether the component bundles at all.
         *
         * Separate from the others on purpose. Text preservation is now checked against the component
         * rendered with its values, which means bundling it first — and a component that fails to
         * bundle would otherwise surface as "missing text: …" for every fragment, which is the wrong
         * diagnosis and the wrong remedy. A bundle failure is a code problem; a text failure is a
         * content problem.
         */
        bundling: ValidationResult;
        textPreservation: ValidationResult;
        contractConformance: ValidationResult;
        tokenBinding: ValidationResult;
    };
    /** Where the whole `GeneratedComponent` lives — the key `generateResultKey` already writes. */
    resultRef: string;
    /**
     * Incremented on every write to the referenced artifact.
     *
     * This exists because a content hash cannot answer "has a refine landed yet". Refining is a model
     * call and may legitimately return byte-identical source; anything derived from content then does
     * not move, and a poll waiting on it never terminates. `revision` is bumped by the writer whether
     * or not the content changed, so it always moves.
     */
    revision: number;
    /**
     * sha256 over the referenced component's content. Answers "did this change materially", which is
     * what a cache key wants — and is deliberately *not* what completion is detected with.
     */
    contentSha256: string;
}

export interface GenerateArtifact {
    components: GeneratedComponentRef[];
    /** Signatures of clusters that never produced a valid component. */
    failed: string[];
}

// ----- Render (rendered-component screenshots, W7.7) ---------------------------------------------

/** One generated component's rendered-screenshot result, keyed to its cluster signature. */
export interface RenderRecord {
    signature: string;
    /** Blob key of the rendered PNG, or "" when the render failed. */
    renderRef: string;
    width: number;
    height: number;
    ok: boolean;
    /**
     * A rough visual-similarity indicator in [0,1] (1 = closest) between the rendered component and its
     * source section crop — greyscale, downscaled, normalised pixel difference. An indicator, not a
     * structural-similarity score; null when either image was unavailable.
     */
    similarity: number | null;
}

/**
 * The rendered screenshots for a run's generated components, produced on demand by the render task and
 * keyed to the Generate stage version it was built from (so a Generate re-run's renders never mix with
 * the previous version's).
 */
export interface RenderArtifact {
    renders: RenderRecord[];
}

// ----- Component decisions (accept/reject, W7.8) -------------------------------------------------

/**
 * An operator's accept/reject decision on a generated component. Stored as a `generate.decision` job
 * override keyed by cluster signature (W8) — the standalone decisions artifact it once used is gone.
 * When any decision exists, Promote moves only the accepted ones; with none it falls back to promoting
 * every component that passed validation.
 */
export type ComponentDecision = "accepted" | "rejected";

// ----- Assemble (output) -------------------------------------------------------------------------

export interface ComponentInstance {
    signature: string;
    componentName: string;
    sectionIndex: number;
    /** Prop values for this instance (Phase 1: the component's representative values). */
    propValues: Record<string, string>;
}

export interface AssembledPage {
    url: string;
    /**
     * The page's `<title>`, forwarded from Capture through Segment. Optional because runs assembled
     * before it was carried have none.
     */
    title?: string;
    /** The page's original capture screenshot (forwarded from Segment), for the side-by-side preview. */
    screenshotRef?: string;
    /**
     * How many sections Segment detected on the page. Sections beyond the matched instances had no
     * generated component and were kept as raw HTML — surfaced in the Assemble view's match line.
     */
    totalSections?: number;
    /** Component instances in document order. */
    instances: ComponentInstance[];
}

export interface AssembleArtifact {
    pages: AssembledPage[];
    /** The token-binding validation for each component, keyed by signature. */
    tokenValidation: Record<string, ValidationResult>;
    /** The Generate artifact key, forwarded so Promote can read the component source without reaching back. */
    componentsRef: string;
}

// ----- Promote (output) --------------------------------------------------------------------------

export interface PromotedComponent {
    signature: string;
    /** The id of the component created in the Library. */
    componentId: string;
    /** The final name it was promoted under (may differ from the planned name after a collision rename). */
    name: string;
}

/**
 * A component that did not reach the Library, and why. The reason matters most for a bundle failure:
 * the Library's invariant is that everything in it is placeable, so a component that cannot be
 * bundled is skipped rather than stored in a broken state — and the run is then the only place an
 * operator can find out what went wrong.
 */
export interface SkippedComponent {
    signature: string;
    reason: string;
}

export interface PromoteArtifact {
    promoted: PromotedComponent[];
    /** Signatures not promoted — failed validation, failed bundling, deselected, or a create error. */
    skipped: SkippedComponent[];
}

// ----- Cluster (structural signature inputs) -----------------------------------------------------

/** The element-type tree shape: nested tag names only — no text, no attributes, no image URLs. */
export interface TypeNode {
    tag: string;
    children: TypeNode[];
}

/**
 * A section's structural fingerprint inputs. The signature is derived from exactly these three and
 * nothing else — text content and image URLs are deliberately excluded so the same section on two pages
 * (different copy, different hero image) clusters together, and so an override reattaches across runs.
 */
export interface SectionShape {
    typeTree: TypeNode;
    /** A coarse layout-geometry class (e.g. "full-width", "two-column", "grid"). */
    geometryClass: string;
    /** The set of theme token names the section resolves against. */
    tokens: string[];
}
