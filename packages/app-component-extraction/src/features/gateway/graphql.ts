const JOB_FIELDS = /* GraphQL */ `
    id
    name
    siteUrl
    themeEntryId
    themeVersion
    pageCap
    gateConfig
    pinned
    note
    createdOn
`;

const RUN_FIELDS = /* GraphQL */ `
    id
    jobId
    runNumber
    status
    note
    counts
    stages {
        stage
        status
        stageVersion
        artifacts
        startedOn
        finishedOn
        error
        taskId
    }
    createdOn
`;

// A stage's log trail, read straight from the Background Tasks store by the stage's task id — so the
// full per-item log is visible in the run view without leaving for CloudWatch. Logs come grouped by
// iteration; the gateway flattens their items.
export const LIST_STAGE_LOGS = /* GraphQL */ `
    query ListComponentExtractionStageLogs($task: ID!) {
        backgroundTasks {
            listLogs(where: { task: $task }, sort: ["createdOn_ASC"], limit: 100) {
                data {
                    iteration
                    items {
                        message
                        type
                        createdOn
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const LIST_JOBS = /* GraphQL */ `
    query ListComponentExtractionJobs {
        componentExtractionListJobs {
            data {
                job { ${JOB_FIELDS} }
                latestRun { ${RUN_FIELDS} }
            }
            error { code message data }
        }
    }
`;

export const GET_JOB = /* GraphQL */ `
    query GetComponentExtractionJob($jobId: ID!) {
        componentExtractionGetJob(jobId: $jobId) {
            data { ${JOB_FIELDS} }
            error { code message data }
        }
    }
`;

export const CREATE_JOB = /* GraphQL */ `
    mutation CreateComponentExtractionJob($data: ComponentExtractionCreateJobInput!) {
        componentExtractionCreateJob(data: $data) {
            data { ${JOB_FIELDS} }
            error { code message data }
        }
    }
`;

export const LIST_RUNS = /* GraphQL */ `
    query ListComponentExtractionRuns($jobId: ID!) {
        componentExtractionListRuns(jobId: $jobId) {
            data { ${RUN_FIELDS} }
            error { code message data }
        }
    }
`;

export const GET_RUN = /* GraphQL */ `
    query GetComponentExtractionRun($runId: ID!) {
        componentExtractionGetRun(runId: $runId) {
            data { ${RUN_FIELDS} }
            error { code message data }
        }
    }
`;

export const CREATE_RUN = /* GraphQL */ `
    mutation CreateComponentExtractionRun($jobId: ID!, $note: String) {
        componentExtractionCreateRun(jobId: $jobId, note: $note) {
            data { ${RUN_FIELDS} }
            error { code message data }
        }
    }
`;

export const RUN_STAGE = /* GraphQL */ `
    mutation RunComponentExtractionStage($runId: ID!, $stage: String!) {
        componentExtractionRunStage(runId: $runId, stage: $stage) {
            data {
                taskId
                runId
                stage
            }
            error {
                code
                message
                data
            }
        }
    }
`;

// The themes a job can bind generated components to. The extraction API doesn't own themes, so this
// reads the Theme app's own endpoint.
export const LIST_THEMES = /* GraphQL */ `
    query ListThemesForComponentExtraction {
        theme {
            listThemes(limit: 100) {
                data {
                    id
                    version
                    properties
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
