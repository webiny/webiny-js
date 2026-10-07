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
        modelUsage
    }
    createdOn
`;

export const GET_RENDERS = /* GraphQL */ `
    query GetComponentExtractionRenders($runId: ID!) {
        componentExtractionGetRenders(runId: $runId) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const LIST_MODEL_CALLS = /* GraphQL */ `
    query ListComponentExtractionModelCalls($runId: ID!) {
        componentExtractionListModelCalls(runId: $runId) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const PROJECT_PLAN_COST = /* GraphQL */ `
    query ProjectComponentExtractionPlanCost($runId: ID!) {
        componentExtractionProjectPlanCost(runId: $runId) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const GET_DECISIONS = /* GraphQL */ `
    query GetComponentExtractionDecisions($runId: ID!) {
        componentExtractionGetDecisions(runId: $runId) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const SET_COMPONENT_DECISION = /* GraphQL */ `
    mutation SetComponentExtractionDecision($runId: ID!, $signature: String!, $decision: String!) {
        componentExtractionSetComponentDecision(
            runId: $runId
            signature: $signature
            decision: $decision
        ) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const GET_GENERATION_LOG = /* GraphQL */ `
    query GetComponentExtractionGenerationLog($runId: ID!, $signature: String!) {
        componentExtractionGetGenerationLog(runId: $runId, signature: $signature) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const GET_GENERATION_PROMPT = /* GraphQL */ `
    query GetComponentExtractionGenerationPrompt(
        $runId: ID!
        $signature: String!
        $entryId: String!
    ) {
        componentExtractionGetGenerationPrompt(
            runId: $runId
            signature: $signature
            entryId: $entryId
        ) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const GET_REVIEWS = /* GraphQL */ `
    query GetComponentExtractionReviews($runId: ID!) {
        componentExtractionGetReviews(runId: $runId) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const SET_COMPONENT_REVIEW = /* GraphQL */ `
    mutation SetComponentExtractionReview(
        $runId: ID!
        $signature: String!
        $verdict: String!
        $reasons: [String!]
        $note: String
    ) {
        componentExtractionSetComponentReview(
            runId: $runId
            signature: $signature
            verdict: $verdict
            reasons: $reasons
            note: $note
        ) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const REGENERATE_COMPONENT = /* GraphQL */ `
    mutation RegenerateComponentExtractionComponent(
        $runId: ID!
        $signature: String!
        $instruction: String!
    ) {
        componentExtractionRegenerateComponent(
            runId: $runId
            signature: $signature
            instruction: $instruction
        ) {
            data {
                taskId
                runId
                stage
            }
            error {
                code
                message
            }
        }
    }
`;

export const REGENERATE_PLAN = /* GraphQL */ `
    mutation RegenerateComponentExtractionPlan(
        $runId: ID!
        $signature: String!
        $instruction: String
    ) {
        componentExtractionRegeneratePlan(
            runId: $runId
            signature: $signature
            instruction: $instruction
        ) {
            data {
                taskId
                runId
                stage
            }
            error {
                code
                message
            }
        }
    }
`;

export const RENDER_COMPONENTS = /* GraphQL */ `
    mutation RenderComponentExtractionComponents($runId: ID!, $signature: String) {
        componentExtractionRenderComponents(runId: $runId, signature: $signature) {
            data {
                taskId
                runId
                stage
            }
            error {
                code
                message
            }
        }
    }
`;

export const GET_COMPONENT_PROMPT = /* GraphQL */ `
    query GetComponentPrompt($runId: ID!, $signature: String!) {
        componentExtractionGetComponentPrompt(runId: $runId, signature: $signature) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const GET_GENERATED_COMPONENT = /* GraphQL */ `
    query GetGeneratedComponent($runId: ID!, $signature: String!) {
        componentExtractionGetGeneratedComponent(runId: $runId, signature: $signature) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const GET_STAGE_ARTIFACT = /* GraphQL */ `
    query GetComponentExtractionStageArtifact($runId: ID!, $stage: String!, $machine: Boolean) {
        componentExtractionGetStageArtifact(runId: $runId, stage: $stage, machine: $machine) {
            data
            error {
                code
                message
            }
        }
    }
`;

export const RECAPTURE_PAGES = /* GraphQL */ `
    mutation RecaptureComponentExtractionPages($runId: ID!, $urls: [String!]!) {
        componentExtractionRecapturePages(runId: $runId, urls: $urls) {
            data {
                taskId
                runId
                stage
            }
            error {
                code
                message
            }
        }
    }
`;

export const EXCLUDE_CAPTURED_PAGES = /* GraphQL */ `
    mutation ExcludeComponentExtractionCapturedPages($runId: ID!, $urls: [String!]!) {
        componentExtractionExcludeCapturedPages(runId: $runId, urls: $urls) {
            data {
                ${RUN_FIELDS}
            }
            error {
                code
                message
            }
        }
    }
`;

// A stage's activity trail. It lives in the task OUTPUT (a JSON field), not the background-task LOG:
// the log record replaces its items on every write (only the last survives), so it can't hold a trail.
// The runner accumulates the trail in output.activity, and this reads it back by the stage's task id —
// so the full per-item activity is visible in the run view without leaving for CloudWatch.
export const GET_STAGE_TASK = /* GraphQL */ `
    query GetComponentExtractionStageTask($id: ID!) {
        backgroundTasks {
            getTask(id: $id) {
                data {
                    id
                    output
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

// Overrides (W8.1). The data field is a JSON scalar carrying the override / reattachment array.
export const LIST_OVERRIDES = /* GraphQL */ `
    query ListComponentExtractionOverrides($jobId: ID!) {
        componentExtractionListOverrides(jobId: $jobId) {
            data
            error {
                code
                message
                data
            }
        }
    }
`;

export const GET_REATTACHMENTS = /* GraphQL */ `
    query GetComponentExtractionReattachments($runId: ID!) {
        componentExtractionGetReattachments(runId: $runId) {
            data
            error {
                code
                message
                data
            }
        }
    }
`;

export const SET_OVERRIDE = /* GraphQL */ `
    mutation SetComponentExtractionOverride(
        $runId: ID!
        $stage: String!
        $signature: String!
        $correction: JSON!
    ) {
        componentExtractionSetOverride(
            runId: $runId
            stage: $stage
            signature: $signature
            correction: $correction
        ) {
            data
            error {
                code
                message
                data
            }
        }
    }
`;

export const CLEAR_OVERRIDE = /* GraphQL */ `
    mutation ClearComponentExtractionOverride($runId: ID!, $overrideId: ID!) {
        componentExtractionClearOverride(runId: $runId, overrideId: $overrideId) {
            data
            error {
                code
                message
                data
            }
        }
    }
`;

export const LIST_LIBRARY_NAMES = /* GraphQL */ `
    query ListComponentExtractionLibraryNames {
        componentExtractionListLibraryNames {
            data
            error {
                code
                message
                data
            }
        }
    }
`;

export const CHECK_REACHABILITY = /* GraphQL */ `
    query CheckComponentExtractionReachability($url: String!) {
        componentExtractionCheckReachability(url: $url) {
            data
            error {
                code
                message
            }
        }
    }
`;

/**
 * The run's page map from the composition proof of concept.
 *
 * Returns `JSON`, so the shape is the API's `PageMap` verbatim — including the per-page `signals`,
 * which are absent on maps composed before they shipped.
 */
export const GET_PAGE_MAP = /* GraphQL */ `
    query GetPageMap($runId: ID!) {
        pageCompositionPocPageMap(runId: $runId) {
            data
            error {
                message
            }
        }
    }
`;

/**
 * Screenshots of the run's composed pages, from a local harness run.
 *
 * `null` for almost every run, and that is the resting state rather than a failure — see
 * `ComposedCaptureDto`.
 */
/**
 * Compose this run's assembled pages into published Website Builder pages.
 *
 * Returns a task id and runs in the background, like a stage. Composition is not a stage — it has no
 * ledger entry — so the only way to know it finished is that the page map changes.
 */
export const COMPOSE_PAGES = /* GraphQL */ `
    mutation ComposePages($runId: ID!) {
        pageCompositionPocComposePages(runId: $runId) {
            data {
                taskId
                runId
            }
            error {
                message
                code
            }
        }
    }
`;

/**
 * The domain the migrated site is served from.
 *
 * Website Builder's own setting, read rather than configured a second time here — it is what the
 * editor points its preview canvas at, so a composed page opened from this app and the same page
 * previewed from the editor resolve to one place by construction.
 */
export const GET_WEBSITE_DOMAIN = /* GraphQL */ `
    query GetWebsiteBuilderPreviewDomain {
        websiteBuilder {
            getSettings {
                data {
                    previewDomain
                }
                error {
                    message
                }
            }
        }
    }
`;

export const GET_COMPOSED_CAPTURE = /* GraphQL */ `
    query GetComposedCapture($runId: ID!) {
        pageCompositionPocComposedCapture(runId: $runId) {
            data
            error {
                message
            }
        }
    }
`;
