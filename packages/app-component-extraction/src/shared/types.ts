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
