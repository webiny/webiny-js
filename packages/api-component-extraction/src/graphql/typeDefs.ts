/**
 * The Component Extraction API (phase 1, minimal).
 *
 * Its own top-level fields (not a namespace) — a run is created, its stages are triggered one at a time
 * through the gate, and a run is read back for polling. The `{ data, error }` envelope matches the rest
 * of the Webiny API.
 */
export const componentExtractionTypeDefs = /* GraphQL */ `
    type ComponentExtractionError {
        message: String
        code: String
        data: JSON
    }

    type ComponentExtractionStage {
        stage: String!
        status: String!
        stageVersion: Int!
        artifacts: JSON!
        startedOn: String
        finishedOn: String
        error: String
        "The background task id of this stage's latest run, for deep-linking to its logs."
        taskId: String
        "Model-usage totals for a model-backed stage (input/output tokens, calls, latency); null otherwise."
        modelUsage: JSON
    }

    type ComponentExtractionArtifactResponse {
        "The stage's structured artifact (capture pages, segment sections, clusters, …), or null if none."
        data: JSON
        error: ComponentExtractionError
    }

    "One discovered URL, as edited on the Discover gate before Capture consumes the list."
    input ComponentExtractionDiscoverUrlInput {
        url: String!
        group: String
    }

    type ComponentExtractionRun {
        id: ID!
        jobId: String!
        runNumber: Int!
        status: String!
        note: String
        counts: JSON!
        stages: [ComponentExtractionStage!]!
        createdOn: String!
    }

    type ComponentExtractionRunResponse {
        data: ComponentExtractionRun
        error: ComponentExtractionError
    }

    type ComponentExtractionTask {
        "The background task started for the stage, for polling and correlation."
        taskId: ID!
        runId: ID!
        stage: String!
    }

    type ComponentExtractionTaskResponse {
        data: ComponentExtractionTask
        error: ComponentExtractionError
    }

    type ComponentExtractionJob {
        id: ID!
        name: String!
        siteUrl: String!
        themeEntryId: String!
        themeVersion: Int!
        pageCap: Int!
        gateConfig: JSON!
        pinned: Boolean!
        note: String
        createdOn: String!
    }

    "A job plus its latest run, for the extractions list (status, current stage, counts)."
    type ComponentExtractionJobListItem {
        job: ComponentExtractionJob!
        latestRun: ComponentExtractionRun
    }

    type ComponentExtractionJobResponse {
        data: ComponentExtractionJob
        error: ComponentExtractionError
    }

    type ComponentExtractionJobListResponse {
        data: [ComponentExtractionJobListItem!]
        error: ComponentExtractionError
    }

    type ComponentExtractionRunListResponse {
        data: [ComponentExtractionRun!]
        error: ComponentExtractionError
    }

    input ComponentExtractionCreateJobInput {
        name: String!
        siteUrl: String!
        themeEntryId: String!
        themeVersion: Int!
        "Defaults to 40, clamped to a hard maximum of 150."
        pageCap: Int
        "The stages the run pauses at. Defaults to every stage."
        stopAfter: [String!]
        note: String
    }

    extend type Query {
        "List jobs with each one's latest run, for the extractions list."
        componentExtractionListJobs: ComponentExtractionJobListResponse!
        componentExtractionGetJob(jobId: ID!): ComponentExtractionJobResponse!
        "The runs of a job, newest first."
        componentExtractionListRuns(jobId: ID!): ComponentExtractionRunListResponse!
        "Read a run, including its nine-stage ledger. The polling fallback to the websocket stream."
        componentExtractionGetRun(runId: ID!): ComponentExtractionRunResponse!
        "The structured artifact a stage produced, for the visibility screens. Image refs are served by the run-image route."
        componentExtractionGetStageArtifact(
            runId: ID!
            stage: String!
        ): ComponentExtractionArtifactResponse!
        "The rendered-component screenshots for a run (W7.7), keyed to the current Generate version. Image refs are served by the run-image route."
        componentExtractionGetRenders(runId: ID!): ComponentExtractionArtifactResponse!
        "The operator's accept/reject decisions on a run's generated components (W7.8), keyed by signature."
        componentExtractionGetDecisions(runId: ID!): ComponentExtractionArtifactResponse!
    }

    extend type Mutation {
        componentExtractionCreateJob(
            data: ComponentExtractionCreateJobInput!
        ): ComponentExtractionJobResponse!
        "Start a new run for a job. Fails if a run is already in flight for that job."
        componentExtractionCreateRun(jobId: ID!, note: String): ComponentExtractionRunResponse!
        "Trigger one stage of a run. Rejected if the stage's predecessor is not yet done."
        componentExtractionRunStage(runId: ID!, stage: String!): ComponentExtractionTaskResponse!
        "Edit the discovered URL list before Capture. Marks Capture and everything downstream stale."
        componentExtractionUpdateDiscoverUrls(
            runId: ID!
            urls: [ComponentExtractionDiscoverUrlInput!]!
        ): ComponentExtractionRunResponse!
        "Drop captured (or failed) pages from a run so they don't flow into Segment. Marks Segment and everything downstream stale."
        componentExtractionExcludeCapturedPages(
            runId: ID!
            urls: [String!]!
        ): ComponentExtractionRunResponse!
        "Render the run's generated components to screenshots for the Generate view (W7.7). Requires Generate to be done."
        componentExtractionRenderComponents(runId: ID!): ComponentExtractionTaskResponse!
        "Set (or clear, with \"none\") the accept/reject decision on a generated component (W7.8). Returns the updated decision map."
        componentExtractionSetComponentDecision(
            runId: ID!
            signature: String!
            decision: String!
        ): ComponentExtractionArtifactResponse!
        "Regenerate one generated component from an instruction via the refine path (W7.8), re-validating and replacing it."
        componentExtractionRegenerateComponent(
            runId: ID!
            signature: String!
            instruction: String!
        ): ComponentExtractionTaskResponse!
    }
`;
