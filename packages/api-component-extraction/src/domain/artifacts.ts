/**
 * The artifact contracts each stage reads and writes. Stages hand off by reference (a key on the
 * ledger); these are the shapes behind those keys. Kept in one place so every stage agrees on them.
 */

// ----- Discover ----------------------------------------------------------------------------------

export interface DiscoveredUrl {
    url: string;
    /** The path-prefix group this URL was sampled from (e.g. "blog", "root"). */
    group: string;
}

export interface DiscoverArtifact {
    entryUrl: string;
    /** How the URLs were found — a real sitemap, or a link crawl of the entry page. */
    source: "sitemap" | "crawl";
    /** The distinct path-prefix groups discovered, for reporting. */
    groups: string[];
    /** The sampled URL list, at most the job's page cap, spread across groups. */
    urls: DiscoveredUrl[];
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
    children: CapturedNode[];
}

/** Signals observed while a page was captured, surfaced as warnings on the Capture grid. */
export interface CaptureWarnings {
    /** A cookie/consent overlay was still present after the visit sequence (dismissal likely failed). */
    consentPresent: boolean;
    /** Broken `<img>` elements (loaded, zero natural size) at capture time, and the total on the page. */
    brokenImages: number;
    totalImages: number;
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
    /** Capture-time warnings (consent overlay, broken images) for the visibility view. */
    warnings: CaptureWarnings;
}

export interface CaptureArtifact {
    pages: CapturedPage[];
    /** URLs that could not be captured — degraded, not fatal. */
    failed: string[];
}

// ----- Segment -----------------------------------------------------------------------------------

/** A candidate section on a page: a bounding box into the full-page screenshot, plus where in the tree. */
export interface SectionBox {
    box: Box;
    /** Index of the section among the content root's children — a stable handle within the page. */
    index: number;
    /** Blob key of this section's cropped, downscaled image, produced by Segment from the screenshot. */
    cropRef: string;
}

export interface SegmentedPage {
    url: string;
    /** The page's screenshot, so section crops come from it rather than a second visit. */
    screenshotRef: string;
    /** Forwarded from Capture so Cluster can read the section subtrees without reaching back. */
    treeRef: string;
    documentHeight: number;
    sections: SectionBox[];
}

export interface SegmentArtifact {
    pages: SegmentedPage[];
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

export interface ComponentProp {
    name: string;
    /** "text" | "richText" | "image" | "url" | "boolean" | … — the model proposes it. */
    type: string;
    /** Sample values observed across the cluster's members. */
    observedValues: string[];
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
        textPreservation: ValidationResult;
        contractConformance: ValidationResult;
        tokenBinding: ValidationResult;
    };
}

export interface GenerateArtifact {
    components: GeneratedComponent[];
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

export interface PromoteArtifact {
    promoted: PromotedComponent[];
    /** Signatures not promoted — failed validation, or a create error. */
    skipped: string[];
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
