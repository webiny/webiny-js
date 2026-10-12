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
        "Set when the stage was marked current without a re-run: when, why, and the status it had."
        markedCurrent: JSON
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
        "The pinned theme; empty while the job is still extracting its own."
        themeEntryId: String!
        themeVersion: Int!
        "The job's own theme extraction, when it was created from a URL alone."
        themeExtraction: JSON
        pageCap: Int!
        gateConfig: JSON!
        pinned: Boolean!
        note: String
        "Approves into and composes in its site tenant. False for jobs created before that existed."
        siteTenantFromStart: Boolean
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

    "A prompt experiment: a label to find its attempts by, the prompt line ids to leave out, and optionally how much the model may think."
    enum ComponentExtractionGenerationEffort {
        low
        medium
        high
    }

    input ComponentExtractionExperimentInput {
        label: String!
        ablate: [String!]!
        include: [String!]
        effort: ComponentExtractionGenerationEffort
    }

    input ComponentExtractionCreateJobInput {
        name: String!
        siteUrl: String!
        "An existing theme to pin. Leave both out to extract the job's theme from the site."
        themeEntryId: String
        themeVersion: Int
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
        """
        One generated component in full — source, css, props and cluster members.

        The Generate stage artifact references its components rather than carrying them, so that it
        stays a bounded item however many components a run produces. The list views read the artifact;
        this is for a view that opens one component.
        """
        componentExtractionGetGeneratedComponent(
            runId: ID!
            signature: String!
        ): ComponentExtractionArtifactResponse!
        """
        The prompt this component would be generated from, built from the current plan and theme.

        Built rather than recorded, so it answers "what would the next run send" rather than "what did
        some earlier run send" — which is the question asked before pressing generate again.
        """
        componentExtractionGetComponentPrompt(
            runId: ID!
            signature: String!
        ): ComponentExtractionArtifactResponse!
        "How well the job's theme fits what was measured on the site, after Plan: colours, type sizes and spacing with a token, of those measured."
        componentExtractionGetThemeFit(runId: ID!): JSON
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
        "Human review verdicts on a run's generated components, keyed by signature: each component's latest, flagged current when given on the output it has now. Data also carries the verdict and reason lists with their labels."
        componentExtractionGetReviews(runId: ID!): ComponentExtractionArtifactResponse!
        "A component's generation log: every Generate attempt (the stage's and generate-again's) with its model, tokens, duration, outcome and failures, oldest first. Prompts are fetched per attempt."
        componentExtractionGetGenerationLog(
            runId: ID!
            signature: String!
        ): ComponentExtractionArtifactResponse!
        "One generation attempt's full prompt: the system prompt, the user message and the ids of the images sent."
        componentExtractionGetGenerationPrompt(
            runId: ID!
            signature: String!
            entryId: String!
        ): ComponentExtractionArtifactResponse!
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
        """
        Abandon a run and free the job's one-in-flight-run slot, so a new run can start.

        The escape hatch for a run that cannot make progress: a stage that will not pass its
        predecessor check, a task that died leaving its stage "running", or simply a run started by
        mistake. Aborts the in-flight stage task where there is one, marks any running stage as not
        having finished, and releases the lock. A finished run cannot be cancelled — there is nothing
        to free.
        """
        componentExtractionCancelRun(runId: ID!): ComponentExtractionRunResponse!
        "Extract the job's theme again from its site: after a failure, or to replace a theme it already has (re-pins it and marks Cluster onward of the latest run stale)."
        componentExtractionRetryJobTheme(jobId: ID!): ComponentExtractionJobResponse!
        "Pin an existing published theme on the job instead of extracting one (marks Cluster onward of the latest run stale when it replaces a theme)."
        componentExtractionUseExistingTheme(
            jobId: ID!
            themeEntryId: String!
            themeVersion: Int!
        ): ComponentExtractionJobResponse!
        "Mark a stale stage current without re-running it, recording the reason on the run's ledger (development only)."
        componentExtractionMarkStageCurrent(
            runId: ID!
            stage: String!
            reason: String!
        ): ComponentExtractionRunResponse!
        """
        Read selected pages again and replace them in the capture artifact.

        For the capture that went wrong one page at a time — an overlay that survived the clearance
        pass, a page that timed out, a hero that had not finished loading. Re-running the whole stage
        was the only remedy and costs a pass over every discovered page. A page that fails to re-read
        keeps the capture it already had. Marks Segment and everything downstream stale.
        """
        componentExtractionRecapturePages(
            runId: ID!
            urls: [String!]!
        ): ComponentExtractionTaskResponse!
        "Drop captured (or failed) pages from a run so they don't flow into Segment. Marks Segment and everything downstream stale."
        componentExtractionExcludeCapturedPages(
            runId: ID!
            urls: [String!]!
        ): ComponentExtractionRunResponse!
        "Render the run's generated components to screenshots for the Generate view (W7.7). Requires Generate to be done. Pass a signature to re-render just that one component; the others keep their current screenshots."
        componentExtractionRenderComponents(
            runId: ID!
            signature: String
        ): ComponentExtractionTaskResponse!
        "Set the accept/reject decision on a generated component (W7.8), or 'none' to clear it. Returns the updated decision map."
        componentExtractionSetComponentDecision(
            runId: ID!
            signature: String!
            decision: String!
        ): ComponentExtractionArtifactResponse!
        "Record a human review verdict on a generated component, bound to its current output. Append-only and logged only: it does not change what Promote moves and does not carry to the job's next run. Returns the updated reviews."
        componentExtractionSetComponentReview(
            runId: ID!
            signature: String!
            verdict: String!
            reasons: [String!]
            note: String
        ): ComponentExtractionArtifactResponse!
        "Regenerate one generated component from an instruction via the refine path (W7.8), re-validating and replacing it."
        componentExtractionRegenerateComponent(
            runId: ID!
            signature: String!
            instruction: String!
        ): ComponentExtractionTaskResponse!
        "Generate selected components again through Generate itself (its prompt, validation and retries, not the refine path), each replacing its component in the finished stage. Data carries the task id per signature. Renders of those components are dropped; render them again after."
        componentExtractionGenerateComponents(
            runId: ID!
            signatures: [String!]!
            """
            A prompt experiment, development environments only: generate with the named prompt lines
            left out, without replacing anything in the run. Results are read from the generation log.
            """
            experiment: ComponentExtractionExperimentInput
            "Install this generation-log entry's output as the component instead of calling the model (one component, development only)."
            installEntryId: String
        ): ComponentExtractionArtifactResponse!
        "Regenerate one component's Plan contract (W8) — a fresh model proposal of its props and token bindings, optionally steered by an instruction, clearing that component's prop edits."
        componentExtractionRegeneratePlan(
            runId: ID!
            signature: String!
            instruction: String
            "Re-bind the component's observed values against its member sections, keeping its contract: no model call. A repair for stored runs, development environments only."
            rebind: Boolean
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
