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

    extend type Query {
        "Read a run, including its nine-stage ledger. The polling fallback to the websocket stream."
        componentExtractionGetRun(runId: ID!): ComponentExtractionRunResponse!
    }

    extend type Mutation {
        "Start a new run for a job. Fails if a run is already in flight for that job."
        componentExtractionCreateRun(jobId: ID!, note: String): ComponentExtractionRunResponse!
        "Trigger one stage of a run. Rejected if the stage's predecessor is not yet done."
        componentExtractionRunStage(runId: ID!, stage: String!): ComponentExtractionTaskResponse!
    }
`;
