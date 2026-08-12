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

export interface CapturedPage {
    url: string;
    finalUrl: string;
    viewport: Box;
    documentHeight: number;
    /** Blob keys for this page's pruned tree, full-page desktop screenshot and compressed raw DOM. */
    treeRef: string;
    screenshotRef: string;
    rawDomRef: string;
    /** Full-page screenshot at the narrow width, for responsive inspection. */
    narrowScreenshotRef: string;
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
}

export interface Cluster {
    signature: string;
    members: ClusterMember[];
    /** The first-seen member, used as the cluster's exemplar by Classify, Plan and Generate. */
    representative: ClusterMember;
}

export interface ClusterArtifact {
    clusters: Cluster[];
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
