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
        "The structured artifact a stage produced, for the visibility screens. Image refs are served by the run-image route. Pass machine:true for the un-overridden (machine) artifact (W8)."
        componentExtractionGetStageArtifact(
            runId: ID!
            stage: String!
            machine: Boolean
        ): ComponentExtractionArtifactResponse!
        "The rendered-component screenshots for a run (W7.7), keyed to the current Generate version. Image refs are served by the run-image route."
        componentExtractionGetRenders(runId: ID!): ComponentExtractionArtifactResponse!
        "The operator's accept/reject decisions on a run's generated components (W7.8), keyed by signature."
        componentExtractionGetDecisions(runId: ID!): ComponentExtractionArtifactResponse!
        "A run's individual model calls (W7.9): stage, call name, model id, tokens in/out, latency, ok."
        componentExtractionListModelCalls(runId: ID!): ComponentExtractionArtifactResponse!
        "Projected generation cost for a run's plan (W7.9): component count × mean tokens/generate-call from prior runs of the job."
        componentExtractionProjectPlanCost(runId: ID!): ComponentExtractionArtifactResponse!
        "A job's active overrides (W8.1) — the corrections that reapply across its runs."
        componentExtractionListOverrides(jobId: ID!): ComponentExtractionArtifactResponse!
        "A run's override reattachment outcomes (W8.1): applied, not-applicable or conflicting, for the panel."
        componentExtractionGetReattachments(runId: ID!): ComponentExtractionArtifactResponse!
        "The names of the components already in the Library, for Promote collision detection (W8.6)."
        componentExtractionListLibraryNames: ComponentExtractionArtifactResponse!
        "Pre-flight reachability for the Create-job screen (W9.3): resolves the URL and looks for a sitemap. Data carries normalizedUrl, reachable, status, sitemapFound, sitemapUrlCount and error."
        componentExtractionCheckReachability(url: String!): ComponentExtractionArtifactResponse!
    }

    extend type Mutation {
        componentExtractionCreateJob(
            data: ComponentExtractionCreateJobInput!
        ): ComponentExtractionJobResponse!
        "Start a new run for a job. Fails if a run is already in flight for that job."
        componentExtractionCreateRun(jobId: ID!, note: String): ComponentExtractionRunResponse!
        "Trigger one stage of a run. Rejected if the stage's predecessor is not yet done."
        componentExtractionRunStage(runId: ID!, stage: String!): ComponentExtractionTaskResponse!
        "Drop captured (or failed) pages from a run so they don't flow into Segment. Marks Segment and everything downstream stale."
        componentExtractionExcludeCapturedPages(
            runId: ID!
            urls: [String!]!
        ): ComponentExtractionRunResponse!
        "Render the run's generated components to screenshots for the Generate view (W7.7). Requires Generate to be done."
        componentExtractionRenderComponents(runId: ID!): ComponentExtractionTaskResponse!
        "Set the accept/reject decision on a generated component (W7.8), or 'none' to clear it. Returns the updated decision map."
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
        "Regenerate one component's Plan contract (W8) — a fresh model proposal of its props and token bindings, optionally steered by an instruction, clearing that component's prop edits."
        componentExtractionRegeneratePlan(
            runId: ID!
            signature: String!
            instruction: String
        ): ComponentExtractionTaskResponse!
        "Set (upsert) a job override from a run (W8.1). Re-corrects in place, marks downstream stale, and appends to the correction log. Returns the job's overrides."
        componentExtractionSetOverride(
            runId: ID!
            stage: String!
            signature: String!
            correction: JSON!
        ): ComponentExtractionArtifactResponse!
        "Clear a job override (W8.1), reverting that item to machine output and marking downstream stale. Returns the job's overrides."
        componentExtractionClearOverride(
            runId: ID!
            overrideId: ID!
        ): ComponentExtractionArtifactResponse!
    }
`;
