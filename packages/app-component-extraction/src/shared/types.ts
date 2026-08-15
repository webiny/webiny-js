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
    sitemapUrlCount: number;
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

export interface DiscoverUrlDto {
    url: string;
    group: string;
    /** The page's <title>, read best-effort at discovery (spec §6.1); null/absent when unavailable. */
    title?: string | null;
}

export interface DiscoverArtifactDto {
    entryUrl: string;
    source: string;
    groups: string[];
    urls: DiscoverUrlDto[];
}

/** Capture-time warnings on a page. Optional — runs captured before this shipped won't carry it. */
export interface CaptureWarningsDto {
    consentPresent: boolean;
    brokenImages: number;
    totalImages: number;
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
    skipped: string[];
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

export interface GeneratedComponentDto {
    signature: string;
    name: string;
    type: string;
    /** The generated JSX source and CSS — surfaced for "view code". */
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

export interface ComponentPropDto {
    name: string;
    type: string;
    observedValues: string[];
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
    /** Rough visual-similarity indicator in [0,1] (1 = closest), or null if not computed. */
    similarity: number | null;
}

export interface RenderArtifactDto {
    renders: RenderRecordDto[];
}

export type ComponentDecisionDto = "accepted" | "rejected";

export interface DecisionsDto {
    decisions: Record<string, ComponentDecisionDto>;
}
