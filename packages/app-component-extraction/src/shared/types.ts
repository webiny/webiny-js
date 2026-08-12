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
