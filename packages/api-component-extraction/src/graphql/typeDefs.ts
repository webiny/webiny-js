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
    }

    extend type Mutation {
        componentExtractionCreateJob(
            data: ComponentExtractionCreateJobInput!
        ): ComponentExtractionJobResponse!
        "Start a new run for a job. Fails if a run is already in flight for that job."
        componentExtractionCreateRun(jobId: ID!, note: String): ComponentExtractionRunResponse!
        "Trigger one stage of a run. Rejected if the stage's predecessor is not yet done."
        componentExtractionRunStage(runId: ID!, stage: String!): ComponentExtractionTaskResponse!
    }
`;
