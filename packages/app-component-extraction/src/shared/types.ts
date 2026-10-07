/** The shapes the GraphQL API returns, shared across the gateway and the presenters. */

export interface RunCounts {
    pages: number;
    sections: number;
    clusters: number;
    components: number;
}

/** Model-usage totals for a model-backed stage (W7.1). */
export interface StageModelUsageDto {
    inputTokens: number;
    outputTokens: number;
    calls: number;
    latencyMs: number;
}

/** One stage's entry in a run's ledger. `status` is one of pending/running/done/stale/failed. */
export interface StageDto {
    stage: string;
    status: string;
    stageVersion: number;
    artifacts: Record<string, unknown>;
    startedOn: string | null;
    finishedOn: string | null;
    error: string | null;
    /** The background task id of this stage's latest run, for reading its logs. */
    taskId: string | null;
    /** Per-stage model-usage totals (W7.1), or null for a deterministic stage / before it closes. */
    modelUsage: StageModelUsageDto | null;
}

/** One line of a stage's task log, for the inline log trail in the run view. */
export interface StageLogItem {
    message: string;
    type: string;
    createdOn: string;
}

/** One line of the activity trail the runner accumulates in the stage task's output. */
export interface StageActivityEntry {
    message: string;
    current?: number;
    total?: number;
    at: string;
}

/** The stage task's output JSON, as read back from `backgroundTasks.getTask`. */
export interface StageTaskOutput {
    activity?: StageActivityEntry[];
    progress?: { stage: string; current: number; total: number; message: string };
}

/** Live progress for the running stage, delivered over the websocket. */
export interface StageProgress {
    current: number;
    total: number;
    message: string;
}

export interface RunDto {
    id: string;
    jobId: string;
    runNumber: number;
    status: string;
    note: string | null;
    counts: RunCounts;
    stages: StageDto[];
    createdOn: string;
}

export interface JobDto {
    id: string;
    name: string;
    siteUrl: string;
    themeEntryId: string;
    themeVersion: number;
    pageCap: number;
    gateConfig: { stopAfter: string[] };
    pinned: boolean;
    note: string | null;
    createdOn: string;
}

/** A job plus its latest run, for the extractions list. */
export interface JobListItemDto {
    job: JobDto;
    latestRun: RunDto | null;
}

/** The Assemble stage artifact (spec §6.8): each page's placed component instances. */
export interface ComponentInstanceDto {
    signature: string;
    componentName: string;
    sectionIndex: number;
    propValues: Record<string, string>;
}
export interface AssembledPageDto {
    url: string;
    /** The page's original capture screenshot, for the side-by-side preview. */
    screenshotRef?: string;
    /** Total sections detected; any beyond the matched instances were kept as raw HTML. */
    totalSections?: number;
    instances: ComponentInstanceDto[];
}
export interface AssembleArtifactDto {
    pages: AssembledPageDto[];
}

/** The Create-job pre-flight reachability result (W9.3). */
export interface ReachabilityDto {
    normalizedUrl: string;
    reachable: boolean;
    status: number | null;
    sitemapFound: boolean;
    /** Pages for a `urlset`; child sitemaps for an `index`. Read it with `sitemapKind`. */
    sitemapUrlCount: number;
    sitemapKind: "urlset" | "index" | "none";
    error: string | null;
}

/** A published/draft theme the extraction can bind generated components to. */
export interface ThemeOptionDto {
    id: string;
    version: number;
    name: string;
}

export interface CreateJobData {
    name: string;
    siteUrl: string;
    themeEntryId: string;
    themeVersion: number;
    pageCap?: number;
    stopAfter?: string[];
    note?: string;
}

// ----- Stage artifact shapes (the subset the visibility views render) ----------------------------

export interface ImageBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** What resolving a URL returned; absent on a manually added URL, which is not resolved. */
export interface UrlResolutionDto {
    status: number | null;
    ok: boolean;
    finalUrl?: string | null;
    /** The URL answered, but from another site — so what answered is not a page of this site. */
    offSite?: boolean;
}

export interface DiscoverUrlDto {
    url: string;
    group: string;
    /** The page's <title>, read best-effort at discovery (spec §6.1); null/absent when unavailable. */
    title?: string | null;
    /** Which source produced this URL. Absent on runs discovered before provenance was recorded. */
    source?: "sitemap" | "crawl" | "both" | "manual";
    resolution?: UrlResolutionDto;
}

/** What each source claimed, so the operator sees the two disagreeing before capture. */
export interface DiscoverySummaryDto {
    sitemapStatus: "absent" | "not-sitemap" | "empty" | "root-only" | "used";
    sitemapClaimed: number;
    sitemapOffHost: number;
    sitemapNonPage: number;
    sitemapUnresolved: number;
    sitemapUsable: number;
    crawled: number;
    crawlDepth: number;
    crawlTruncated?: boolean;
    sitemapTruncated?: boolean;
    union: number;
    overCap: number;
}

export interface DiscoverArtifactDto {
    entryUrl: string;
    /** Absent on runs discovered before the two sources were reconciled. */
    discovery?: DiscoverySummaryDto;
    groups: string[];
    urls: DiscoverUrlDto[];
    /** Discovered but not included, because the URL did not resolve. */
    unresolved?: DiscoverUrlDto[];
}

/** Capture-time warnings on a page. Optional — runs captured before this shipped won't carry it. */
export interface CaptureWarningsDto {
    /** What the overlay pass found still covering the page, or null/absent when it came back clean. */
    overlayRemains?: string | null;
    brokenImages: number;
    totalImages: number;
    /** The page's real height when the screenshot had to stop short of it. */
    screenshotTruncatedAt?: number;
    /** Web font families that failed to load, or had not arrived in time. */
    fontsFailed?: string[];
    fontsPending?: string[];
}

/** One run of the overlay pass. */
export interface OverlayPassDto {
    hidden: string[];
    dismissed: string[];
    removed: string[];
    unlockedScroll: boolean;
}

/** Both runs, kept apart. Absent on runs captured before this shipped. */
export interface OverlayClearanceDto {
    early: OverlayPassDto;
    late: OverlayPassDto;
}

export interface CapturePageDto {
    url: string;
    finalUrl: string;
    /** The page's `<title>`; may be absent on older runs. */
    title?: string;
    documentHeight: number;
    screenshotRef: string;
    narrowScreenshotRef: string;
    thumbnailRef: string;
    warnings?: CaptureWarningsDto;
    /** What the overlay pass took off this page, by pass. Absent on runs captured before it shipped. */
    overlayClearance?: OverlayClearanceDto;
}

/** A page that failed to capture, with its reason. */
export interface CaptureFailureDto {
    url: string;
    reason: string;
}
export interface CaptureArtifactDto {
    pages: CapturePageDto[];
    /** {url, reason}[] since reasons were captured; a plain URL string[] on older runs. */
    failed: (CaptureFailureDto | string)[];
}

export interface SegmentSectionDto {
    index: number;
    box: ImageBox;
    cropRef: string;
}

export interface SegmentPageDto {
    url: string;
    screenshotRef: string;
    documentHeight: number;
    sections: SegmentSectionDto[];
}

export interface SegmentArtifactDto {
    pages: SegmentPageDto[];
    /** The section-container height this run used. Absent on runs segmented before it was tunable. */
    maxSectionHeight?: number;
}

export interface ClusterMemberDto {
    url: string;
    sectionIndex: number;
    signature: string;
    cropRef: string;
}

export interface ClusterDto {
    signature: string;
    representative: ClusterMemberDto;
    members: ClusterMemberDto[];
    representativeCrop: { cropRef: string };
    digest: { structure: string; texts: string[] };
    observedTexts: string[];
    /** Set by a cluster.exclude override (W8): visible, muted, restorable; skipped downstream. */
    excluded?: boolean;
}

export interface ThresholdCurvePointDto {
    threshold: number;
    clusters: number;
}

export interface ClusterArtifactDto {
    clusters: ClusterDto[];
    /** The similarity threshold this artifact was clustered at (W8.3). */
    threshold?: number;
    /** The highest similarity between any two clusters (0–1). */
    nearestPair?: number;
    /** Cluster count across a grid of thresholds, for the slider's live preview. */
    thresholdCurve?: ThresholdCurvePointDto[];
}

export interface ClassifiedClusterDto {
    cluster: ClusterDto;
    type: string;
    name: string;
    confidence: number;
    unclassified: boolean;
}

export interface ClassifyArtifactDto {
    clusters: ClassifiedClusterDto[];
}

export interface PromoteArtifactDto {
    promoted: { signature: string; componentId: string; name: string }[];
    /**
     * Components that did not reach the Library, with why. A component that cannot be bundled is
     * skipped rather than stored unplaceable, so this is the only record of that decision — runs
     * written before the reason existed carry bare signatures, which is why `reason` is optional.
     */
    skipped: { signature: string; reason?: string }[];
}

// ----- Overrides (W8) ----------------------------------------------------------------------------

/** A correction payload — loosely typed on the frontend; the kind discriminates it. */
export interface CorrectionDto {
    kind: string;
    [key: string]: unknown;
}

export interface OverrideDto {
    id: string;
    stage: string;
    structuralSignature: string;
    correction: CorrectionDto;
    originRunId: string;
}

export interface ReattachmentDto {
    overrideId: string;
    stage: string;
    signature: string;
    kind: string;
    status: "applied" | "not-applicable" | "conflicting";
    reason: string | null;
}

export interface ValidationResultDto {
    passed: boolean;
    failures: string[];
}

export interface ComponentMemberDto {
    url: string;
    sectionIndex: number;
    cropRef: string;
}

/**
 * A component as the Generate list sees it: enough to render a row, and no source.
 *
 * The stage artifact references its components rather than carrying them, so that its size depends on
 * how many components a run produced rather than on how large they are. Source and cluster members
 * are fetched per component, by the view that opens one.
 */
export interface GeneratedComponentDto {
    signature: string;
    name: string;
    type: string;
    attempts: number;
    memberCount: number;
    pageCount: number;
    propCount: number;
    validation: {
        textPreservation: ValidationResultDto;
        contractConformance: ValidationResultDto;
        tokenBinding: ValidationResultDto;
    };
    /**
     * Moves on every write to the component, whether or not its content changed. A refine may return
     * byte-identical source, so watching content would leave the poll running forever.
     */
    revision: number;
    contentSha256: string;
    /** Absent on artifacts written before components were referenced, which carried source inline. */
    source?: string;
    css?: string;
    members?: ComponentMemberDto[];
}

/** One component in full, from `componentExtractionGetGeneratedComponent`. */
/** The prompt a component would be generated from, built from the current plan and theme. */
export interface ComponentPromptDto {
    signature: string;
    name: string;
    prompt: string;
    /** Set only when the theme could not be resolved, in which case the prompt names no variables. */
    themeError: string | null;
}

export interface GeneratedComponentDetailDto {
    signature: string;
    name: string;
    type: string;
    source: string;
    css: string;
    attempts: number;
    members: ComponentMemberDto[];
    validation: {
        textPreservation: ValidationResultDto;
        contractConformance: ValidationResultDto;
        tokenBinding: ValidationResultDto;
    };
}

export interface GenerateArtifactDto {
    components: GeneratedComponentDto[];
    failed: string[];
}

/** Model-proposed observation of a prop across the cluster (see PropObservation on the API side). */
export interface PropObservationDto {
    presentInstances?: number | null;
    totalInstances?: number | null;
    countMin?: number | null;
    countMax?: number | null;
    valueCounts?: { value: string; count: number }[] | null;
}

export interface ComponentPropDto {
    name: string;
    type: string;
    /** Optional prop — renders a trailing "?". */
    optional?: boolean;
    /** Array / repeated prop — renders "[]" and drives per-instance / per-item phrasing. */
    array?: boolean;
    /** Sub-fields for composite props (object, Link/Image/Point, array-of-object). */
    fields?: ComponentPropDto[];
    observedValues: string[];
    observation?: PropObservationDto;
}

export interface TokenBindingDto {
    target: string;
    token: string;
}

/** One planned component: name/type/pages for the gate, plus editable props and read-only token bindings. */
export interface PlannedComponentDto {
    signature: string;
    name: string;
    type: string;
    props: ComponentPropDto[];
    tokenBindings: TokenBindingDto[];
    members: { url: string }[];
    representativeCrop: { cropRef: string };
    /** The operator's cumulative "Regenerate props" instructions, oldest first (W-refine). */
    refinements?: string[];
}

export interface PlanArtifactDto {
    components: PlannedComponentDto[];
}

/** One model call in the token panel (W7.9). */
export interface ModelCallDto {
    stage: string;
    name: string;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    ok: boolean;
    createdOn: string;
}

/** The Plan-gate cost projection (W7.9). `meanTokensPerCall`/`projectedTokens` are null with no prior run. */
export interface PlanCostProjectionDto {
    components: number;
    meanTokensPerCall: number | null;
    projectedTokens: number | null;
    priorRuns: number;
}

/** One generated component's rendered-screenshot result (W7.7), keyed to its cluster signature. */
export interface RenderRecordDto {
    signature: string;
    renderRef: string;
    width: number;
    height: number;
    ok: boolean;
    /** The source section crop's size, stated beside the render's rather than reduced to a score. */
    sourceWidth: number | null;
    sourceHeight: number | null;
    /**
     * What the render observed about the component's images. A report, not a gate — it is produced
     * after Generate has accepted the component, so it fails nothing.
     */
    imageCheck?: {
        stringifiedValues: string[];
        failedRequests: string[];
        declaredButUnused: string[];
    };
    /** What the rendered component measured — content inset and type sizes. */
    geometry?: {
        contentLeft: number;
        contentRight: number;
        maxFontSize: number;
        medianFontSize: number;
        medianLineHeight: number | null;
        textElements: number;
    } | null;
    /** Why this component did not render, when it did not. */
    error?: string;
    /** What the page reported while rendering — present even when the render completed. */
    pageErrors?: string[];
}

export interface RenderArtifactDto {
    renders: RenderRecordDto[];
}

export type ComponentDecisionDto = "accepted" | "rejected";

export interface DecisionsDto {
    decisions: Record<string, ComponentDecisionDto>;
}

/** One Generate attempt of a component, from its generation log. */
export interface GenerationLogEntryDto {
    id: string;
    recordedOn: string;
    stageVersion: number;
    trigger: "generate" | "generate-again" | "refine";
    attempt: number;
    maxAttempts: number;
    model: string;
    durationMs: number;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        cacheWriteTokens: number;
    };
    finishReason?: string;
    outputChars?: number;
    outcome: "passed" | "failed-checks" | "call-failed";
    error?: string;
    failures: string[];
}

export interface GenerationLogDto {
    signature: string;
    entries: GenerationLogEntryDto[];
}

/** One attempt's whole prompt. */
export interface GenerationPromptDto {
    system: string;
    user: string;
    imageFileIds: string[];
    /** The image parts the request actually carried. */
    imagesAttached?: { mediaType: string; bytes: number }[];
}

/** A human review verdict on one generated component, as the API stands it: its latest. */
export interface ComponentReviewDto {
    signature: string;
    verdict: string;
    reasons: string[];
    note: string | null;
    reviewedOn: string;
    reviewer: { id: string; displayName: string | null } | null;
    contentSha256: string;
    revision: number;
    /** False once the component has been regenerated or refined since the review was given. */
    current: boolean;
}

export interface ReviewOptionDto {
    value: string;
    label: string;
}

export interface ReviewsDto {
    reviews: Record<string, ComponentReviewDto>;
    /** The verdict levels and reasons, with their labels — owned by the API, so a relabel is one place. */
    verdicts: ReviewOptionDto[];
    reasons: ReviewOptionDto[];
}

export interface ReviewInputDto {
    verdict: string;
    reasons: string[];
    note: string;
}

// ----- Page composition (proof of concept) -------------------------------------------------------

/** An instance Assemble placed that composition could not turn into a component. */
export interface UnplacedInstanceDto {
    signature: string;
    index: number;
}

/** This page's destination outcome. Same shape as the run total, counted for one page. */
export interface PageLinksDto {
    before: number;
    after: number;
    rewritten: number;
    external: number;
    unmigrated: number;
    dropped: number;
    recovered: number;
}

/**
 * The four fidelity signals for one composed page.
 *
 * Deliberately not a similarity score: heights differ, fonts load differently, and one missing
 * section shifts everything below it, so a single number reads badly on a page that migrated well.
 * These say where a page went wrong instead.
 */
export interface PageSignalsDto {
    sourceSections: number;
    assembledInstances: number;
    composedInstances: number;
    unplaced: UnplacedInstanceDto[];
    textTotal: number;
    textPresent: number;
    /** A capped sample of the source runs the composed page does not carry. */
    textMissingSample?: string[];
    links: PageLinksDto;
}

export interface ComposedPageDto {
    sourceUrl: string;
    normalizedUrl: string;
    path: string;
    title: string;
    pageId: string;
    entryId: string;
    /** Absent on page maps composed before the signals shipped. */
    signals?: PageSignalsDto;
}

export interface ComposedPageFailureDto {
    sourceUrl: string;
    reason: string;
}

export interface ComposedDiscardDto {
    kind: string;
    page: string;
    sourceUrl: string;
    detail: string;
}

export interface PageMapDto {
    runId: string;
    composedOn: string;
    /** Which composition this is. Absent on maps written before the counter existed — read as 0. */
    composeVersion?: number;
    pages: ComposedPageDto[];
    failed: ComposedPageFailureDto[];
    links: PageLinksDto;
    discarded: ComposedDiscardDto[];
}

/**
 * Screenshots of a run's composed pages, produced by a developer running the local harness.
 *
 * Null is the normal answer, not an error: nothing in this project can photograph a composed page
 * automatically, because the website app that renders them links an unpublished SDK and cannot be
 * deployed. Until someone runs the harness, a run has no composed capture, and the view must say
 * that rather than imply the migration failed.
 */
export interface ComposedCaptureDto {
    runId: string;
    /** The `PageMapDto.composeVersion` these photographed. Behind the map's ⇒ the pair is stale. */
    composeVersion: number;
    capturedAt: string;
    viewportWidth: number;
    source: string;
    pages: ComposedCapturePageDto[];
}

export interface ComposedCapturePageDto {
    path: string;
    status: "captured" | "skipped";
    screenshotRef?: string;
    /** Why this page has no screenshot, in the harness's own words. */
    reason?: string;
    viewportWidth?: number;
}
