/** The shapes the GraphQL API returns, shared across the gateway and the presenters. */

export interface RunCounts {
    pages: number;
    sections: number;
    clusters: number;
    components: number;
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

export interface CaptureArtifactDto {
    pages: CapturePageDto[];
    failed: string[];
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
    cropRef: string;
}

export interface ClusterDto {
    signature: string;
    representative: ClusterMemberDto;
    members: ClusterMemberDto[];
    representativeCrop: { cropRef: string };
    digest: { structure: string; texts: string[] };
    observedTexts: string[];
}

export interface ClusterArtifactDto {
    clusters: ClusterDto[];
}

export interface ValidationResultDto {
    passed: boolean;
    failures: string[];
}

export interface GeneratedComponentDto {
    signature: string;
    name: string;
    type: string;
    attempts: number;
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

/** One generated component's rendered-screenshot result (W7.7), keyed to its cluster signature. */
export interface RenderRecordDto {
    signature: string;
    renderRef: string;
    width: number;
    height: number;
    ok: boolean;
}

export interface RenderArtifactDto {
    renders: RenderRecordDto[];
}
