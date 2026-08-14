import { ErrorResponse, Response } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { componentExtractionTypeDefs } from "./typeDefs.js";
import { ComponentExtractionPermissions } from "~/features/permissions.js";
import {
    CorrectionRepository,
    JobRepository,
    ModelCallRepository,
    OverrideRepository,
    RunLock,
    RunRepository
} from "~/domain/abstractions.js";
import { StageArtifactStore } from "~/domain/stage.js";
import { initLedger, markStaleFrom, stageEntry } from "~/domain/ledger.js";
import type {
    CaptureArtifact,
    ClassifyArtifact,
    ClusterArtifact,
    ComponentDecision,
    DecisionsArtifact,
    DiscoverArtifact,
    DiscoveredUrl,
    PlanArtifact
} from "~/domain/artifacts.js";
import type { Correction, Run } from "~/domain/types.js";
import {
    DEFAULT_PAGE_CAP,
    MAX_PAGE_CAP,
    previousStage,
    REGENERATE_COMPONENT_TASK_ID,
    RENDER_COMPONENTS_TASK_ID,
    runReattachmentsKey,
    stageArtifactKey,
    stagesAfter,
    STAGES,
    stageTaskId,
    type Stage
} from "~/constants.js";
import { ExtractionRunInProgressError } from "~/domain/errors.js";
import type { StageTaskInput } from "~/features/stages/StageTaskRunner.js";
import { OverrideApplicator, stageArtifactName } from "~/features/shared/OverrideApplicator.js";

/** Thin resolvers: authorize, delegate, map onto the `{ data, error }` envelope. */
const resolve = async (fn: () => Promise<unknown>) => {
    try {
        return new Response(await fn());
    } catch (error) {
        return new ErrorResponse(error);
    }
};

const isStage = (value: string): value is Stage => (STAGES as readonly string[]).includes(value);

/** The machine value for the affected item (W8.2 correction log) — best-effort per stage. */
const extractMachineValue = (stage: Stage, signature: string, artifact: unknown): unknown => {
    if (!artifact) {
        return null;
    }
    if (stage === "classify") {
        const found = (artifact as ClassifyArtifact).clusters.find(
            entry => entry.cluster.signature === signature
        );
        return found ? { name: found.name, type: found.type, confidence: found.confidence } : null;
    }
    if (stage === "plan") {
        const found = (artifact as PlanArtifact).components.find(
            component => component.signature === signature
        );
        return found ? { props: found.props } : null;
    }
    if (stage === "cluster") {
        const found = (artifact as ClusterArtifact).clusters.find(
            cluster => cluster.representative.signature === signature
        );
        return found
            ? {
                  signature: found.signature,
                  members: found.members.length,
                  excluded: !!found.excluded
              }
            : null;
    }
    return null;
};

/**
 * Re-apply a stage's overrides in place and mark everything downstream stale (W8.1). An artifact override
 * edits the stage's output without re-running it, so the effective artifact is recomputed from the machine
 * one here and the downstream stages — whose inputs changed — go stale.
 */
const reapplyStage = async (
    applicator: OverrideApplicator.Interface,
    runRepository: RunRepository.Interface,
    run: Run,
    stage: Stage
): Promise<void> => {
    const entry = stageEntry(run.stages, stage);
    if (!entry) {
        return;
    }
    const applied = await applicator.apply({
        stage,
        jobId: run.jobId,
        runId: run.id,
        artifacts: entry.artifacts,
        artifactKey: name => stageArtifactKey(run.id, stage, entry.stageVersion, name)
    });
    let stages = run.stages;
    if (applied.isOk()) {
        stages = stages.map(current =>
            current.stage === stage ? { ...current, artifacts: applied.value.artifacts } : current
        );
    }
    const downstream = stagesAfter(stage)[0];
    if (downstream) {
        stages = markStaleFrom(stages, downstream);
    }
    await runRepository.update(run.id, { stages });
};

export const addComponentExtractionSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(componentExtractionTypeDefs);

    builder.addResolver({
        path: "Mutation.componentExtractionCreateRun",
        dependencies: [ComponentExtractionPermissions, JobRepository, RunRepository, RunLock],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            jobRepository: JobRepository.Interface,
            runRepository: RunRepository.Interface,
            runLock: RunLock.Interface
        ) {
            return ({ args }: { args: { jobId: string; note?: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }

                    const jobResult = await jobRepository.get(args.jobId);
                    if (jobResult.isFail()) {
                        throw jobResult.error;
                    }
                    const job = jobResult.value;

                    // One in-flight run per job. Checked before creating so a taken slot does not leave
                    // an orphan run behind.
                    const held = await runLock.current(job.id);
                    if (held.isFail()) {
                        throw held.error;
                    }
                    if (held.value) {
                        throw new ExtractionRunInProgressError(job.id, held.value);
                    }

                    const latest = await runRepository.listByJob(job.id, {
                        limit: 1,
                        sort: ["runNumber_DESC"]
                    });
                    const runNumber =
                        latest.isOk() && latest.value.runs[0]
                            ? latest.value.runs[0].runNumber + 1
                            : 1;

                    const created = await runRepository.create({
                        jobId: job.id,
                        runNumber,
                        status: "pending",
                        note: args.note ?? "",
                        pinned: false,
                        counts: { pages: 0, sections: 0, clusters: 0, components: 0 },
                        stages: initLedger()
                    });
                    if (created.isFail()) {
                        throw created.error;
                    }
                    const run = created.value;

                    const acquired = await runLock.acquire(job.id, run.id);
                    if (acquired.isFail()) {
                        throw acquired.error;
                    }

                    return run;
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionRunStage",
        dependencies: [ComponentExtractionPermissions, RunRepository, TaskService],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            taskService: TaskService.Interface
        ) {
            return ({ args }: { args: { runId: string; stage: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }
                    if (!isStage(args.stage)) {
                        throw new Error(`Unknown stage "${args.stage}".`);
                    }
                    const stage = args.stage;

                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;

                    // Predecessor enforcement: a stage cannot run before the stage before it is done.
                    const previous = previousStage(stage);
                    if (previous) {
                        const previousEntry = stageEntry(run.stages, previous);
                        if (!previousEntry || previousEntry.status !== "done") {
                            throw new Error(`Cannot run "${stage}" before "${previous}" is done.`);
                        }
                    }

                    // A "running" stage is intentionally re-triggerable: if its task was hard-killed
                    // (e.g. a Lambda timeout mid-item), the ledger is stuck "running" with no live task.
                    // Re-triggering resumes from the stage's checkpoint — if every item was already
                    // processed, the new run just writes the final artifact and marks the stage done.
                    const triggered = await taskService.trigger<StageTaskInput>({
                        definition: stageTaskId(stage),
                        name: `Component extraction — ${stage} (run ${run.runNumber})`,
                        input: { runId: run.id }
                    });
                    if (triggered.isFail()) {
                        throw triggered.error;
                    }

                    return { taskId: triggered.value.id, runId: run.id, stage };
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionGetRun",
        dependencies: [ComponentExtractionPermissions, RunRepository],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    return runResult.value;
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionCreateJob",
        dependencies: [ComponentExtractionPermissions, JobRepository],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            jobRepository: JobRepository.Interface
        ) {
            return ({
                args
            }: {
                args: {
                    data: {
                        name: string;
                        siteUrl: string;
                        themeEntryId: string;
                        themeVersion: number;
                        pageCap?: number;
                        stopAfter?: string[];
                        note?: string;
                    };
                };
            }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }
                    const data = args.data;
                    const pageCap = Math.min(
                        Math.max(1, data.pageCap ?? DEFAULT_PAGE_CAP),
                        MAX_PAGE_CAP
                    );
                    const stopAfter =
                        data.stopAfter && data.stopAfter.length
                            ? data.stopAfter.filter(isStage)
                            : [...STAGES];

                    const created = await jobRepository.create({
                        name: data.name,
                        siteUrl: data.siteUrl,
                        themeEntryId: data.themeEntryId,
                        themeVersion: data.themeVersion,
                        pageCap,
                        gateConfig: { stopAfter },
                        pinned: false,
                        note: data.note ?? ""
                    });
                    if (created.isFail()) {
                        throw created.error;
                    }
                    return created.value;
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionListJobs",
        dependencies: [ComponentExtractionPermissions, JobRepository, RunRepository],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            jobRepository: JobRepository.Interface,
            runRepository: RunRepository.Interface
        ) {
            return () =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const jobsResult = await jobRepository.list();
                    if (jobsResult.isFail()) {
                        throw jobsResult.error;
                    }
                    // One run lookup per job — fine at Phase-1 job counts.
                    const items = [];
                    for (const job of jobsResult.value.jobs) {
                        const runs = await runRepository.listByJob(job.id, {
                            limit: 1,
                            sort: ["runNumber_DESC"]
                        });
                        items.push({
                            job,
                            latestRun: runs.isOk() && runs.value.runs[0] ? runs.value.runs[0] : null
                        });
                    }
                    return items;
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionGetJob",
        dependencies: [ComponentExtractionPermissions, JobRepository],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            jobRepository: JobRepository.Interface
        ) {
            return ({ args }: { args: { jobId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const jobResult = await jobRepository.get(args.jobId);
                    if (jobResult.isFail()) {
                        throw jobResult.error;
                    }
                    return jobResult.value;
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionListRuns",
        dependencies: [ComponentExtractionPermissions, RunRepository],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface
        ) {
            return ({ args }: { args: { jobId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const runsResult = await runRepository.listByJob(args.jobId, {
                        sort: ["runNumber_DESC"]
                    });
                    if (runsResult.isFail()) {
                        throw runsResult.error;
                    }
                    return runsResult.value.runs;
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionGetStageArtifact",
        dependencies: [ComponentExtractionPermissions, RunRepository, StageArtifactStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface
        ) {
            return ({ args }: { args: { runId: string; stage: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    if (!isStage(args.stage)) {
                        throw new Error(`Unknown stage "${args.stage}".`);
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const entry = stageEntry(runResult.value.stages, args.stage);
                    // A stage stores its output under a single artifact key; return its contents verbatim.
                    const key = entry ? Object.values(entry.artifacts)[0] : undefined;
                    if (!key) {
                        return null;
                    }
                    const artifact = await store.getJson(key);
                    return artifact.isOk() ? artifact.value : null;
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionListOverrides",
        dependencies: [ComponentExtractionPermissions, OverrideRepository],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            overrides: OverrideRepository.Interface
        ) {
            return ({ args }: { args: { jobId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const result = await overrides.listByJob(args.jobId);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionGetReattachments",
        dependencies: [ComponentExtractionPermissions, StageArtifactStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            store: StageArtifactStore.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const result = await store.getJson(runReattachmentsKey(args.runId));
                    return result.isOk() && Array.isArray(result.value) ? result.value : [];
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionSetOverride",
        dependencies: [
            ComponentExtractionPermissions,
            RunRepository,
            OverrideRepository,
            CorrectionRepository,
            StageArtifactStore,
            OverrideApplicator
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            overrides: OverrideRepository.Interface,
            corrections: CorrectionRepository.Interface,
            store: StageArtifactStore.Interface,
            applicator: OverrideApplicator.Interface
        ) {
            return ({
                args
            }: {
                args: { runId: string; stage: string; signature: string; correction: unknown };
            }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to edit component extraction.");
                    }
                    if (!isStage(args.stage)) {
                        throw new Error(`Unknown stage "${args.stage}".`);
                    }
                    const stage = args.stage;
                    const correction = args.correction as Correction;
                    if (!correction || typeof correction.kind !== "string") {
                        throw new Error("A correction with a kind is required.");
                    }

                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;
                    const entry = stageEntry(run.stages, stage);
                    if (!entry || (entry.status !== "done" && entry.status !== "stale")) {
                        throw new Error(`Run "${stage}" before correcting it.`);
                    }

                    // Capture the machine value for the affected item for the correction log (W8.2).
                    const name = stageArtifactName(stage);
                    let machineValue: unknown = null;
                    if (name) {
                        const machineRef =
                            entry.artifacts[`${name}.machine`] ?? entry.artifacts[name];
                        if (machineRef) {
                            const machine = await store.getJson(machineRef);
                            if (machine.isOk()) {
                                machineValue = extractMachineValue(
                                    stage,
                                    args.signature,
                                    machine.value
                                );
                            }
                        }
                    }

                    const upserted = await overrides.upsert({
                        jobId: run.jobId,
                        stage,
                        structuralSignature: args.signature,
                        correction,
                        originRunId: run.id
                    });
                    if (upserted.isFail()) {
                        throw upserted.error;
                    }

                    // No correction is possible through a route that bypasses the log (W8.2).
                    await corrections.create({
                        runId: run.id,
                        jobId: run.jobId,
                        stage,
                        stageVersion: entry.stageVersion,
                        signature: args.signature,
                        kind: correction.kind,
                        machineValue,
                        humanValue: correction
                    });

                    await reapplyStage(applicator, runRepository, run, stage);

                    const list = await overrides.listByJob(run.jobId);
                    return list.isOk() ? list.value : [];
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionClearOverride",
        dependencies: [
            ComponentExtractionPermissions,
            RunRepository,
            OverrideRepository,
            OverrideApplicator
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            overrides: OverrideRepository.Interface,
            applicator: OverrideApplicator.Interface
        ) {
            return ({ args }: { args: { runId: string; overrideId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to edit component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;
                    const list = await overrides.listByJob(run.jobId);
                    const target = list.isOk()
                        ? list.value.find(override => override.id === args.overrideId)
                        : undefined;
                    if (!target) {
                        throw new Error("Override not found.");
                    }
                    const deleted = await overrides.delete(args.overrideId);
                    if (deleted.isFail()) {
                        throw deleted.error;
                    }
                    await reapplyStage(applicator, runRepository, run, target.stage);
                    const remaining = await overrides.listByJob(run.jobId);
                    return remaining.isOk() ? remaining.value : [];
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionUpdateDiscoverUrls",
        dependencies: [ComponentExtractionPermissions, RunRepository, StageArtifactStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface
        ) {
            return ({
                args
            }: {
                args: { runId: string; urls: Array<{ url: string; group?: string }> };
            }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to edit component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;

                    const discover = stageEntry(run.stages, "discover");
                    const discoverKey = discover ? discover.artifacts.urls : undefined;
                    if (!discover || discover.status !== "done" || !discoverKey) {
                        throw new Error("Discover has not produced a URL list to edit.");
                    }

                    const artifactResult = await store.getJson<DiscoverArtifact>(discoverKey);
                    if (artifactResult.isFail() || !artifactResult.value) {
                        throw new Error("The discover artifact could not be read.");
                    }

                    const urls: DiscoveredUrl[] = args.urls.map(item => ({
                        url: item.url,
                        group: item.group ?? "manual"
                    }));
                    const updated: DiscoverArtifact = {
                        ...artifactResult.value,
                        groups: [...new Set(urls.map(item => item.group))],
                        urls
                    };
                    const written = await store.putJson(discoverKey, updated);
                    if (written.isFail()) {
                        throw written.error;
                    }

                    // Editing Discover's output invalidates Capture and everything downstream.
                    const stages = markStaleFrom(run.stages, "capture");
                    const persisted = await runRepository.update(run.id, {
                        stages,
                        counts: { ...run.counts, pages: urls.length }
                    });
                    if (persisted.isFail()) {
                        throw persisted.error;
                    }
                    return persisted.value;
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionExcludeCapturedPages",
        dependencies: [ComponentExtractionPermissions, RunRepository, StageArtifactStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface
        ) {
            return ({ args }: { args: { runId: string; urls: string[] } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to edit component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;

                    const capture = stageEntry(run.stages, "capture");
                    const captureKey = capture ? capture.artifacts.pages : undefined;
                    if (!capture || capture.status !== "done" || !captureKey) {
                        throw new Error("Capture has not produced pages to edit.");
                    }

                    const artifactResult = await store.getJson<CaptureArtifact>(captureKey);
                    if (artifactResult.isFail() || !artifactResult.value) {
                        throw new Error("The capture artifact could not be read.");
                    }

                    // Drop the excluded URLs from both the captured pages and the failed list, so neither
                    // flows downstream. Blobs are left to the job's retention TTL rather than deleted here.
                    const excluded = new Set(args.urls);
                    const artifact = artifactResult.value;
                    const pages = artifact.pages.filter(page => !excluded.has(page.url));
                    const failed = artifact.failed.filter(url => !excluded.has(url));
                    if (pages.length === 0) {
                        throw new Error(
                            "Excluding these pages would leave the run with nothing to segment."
                        );
                    }
                    const updated: CaptureArtifact = { ...artifact, pages, failed };
                    const written = await store.putJson(captureKey, updated);
                    if (written.isFail()) {
                        throw written.error;
                    }

                    // Capture itself stays done (fewer pages); Segment and everything after must re-run.
                    const stages = markStaleFrom(run.stages, "segment");
                    const persisted = await runRepository.update(run.id, {
                        stages,
                        counts: { ...run.counts, pages: pages.length }
                    });
                    if (persisted.isFail()) {
                        throw persisted.error;
                    }
                    return persisted.value;
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionGetRenders",
        dependencies: [ComponentExtractionPermissions, RunRepository, StageArtifactStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const generate = stageEntry(runResult.value.stages, "generate");
                    if (!generate || !generate.artifacts.components) {
                        return null;
                    }
                    // Keyed to the current Generate version, so a re-run's stale renders never surface.
                    const key = stageArtifactKey(
                        args.runId,
                        "generate",
                        generate.stageVersion,
                        "renders"
                    );
                    const artifact = await store.getJson(key);
                    return artifact.isOk() ? artifact.value : null;
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionGetDecisions",
        dependencies: [ComponentExtractionPermissions, RunRepository, StageArtifactStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const generate = stageEntry(runResult.value.stages, "generate");
                    if (!generate) {
                        return { decisions: {} };
                    }
                    const key = stageArtifactKey(
                        args.runId,
                        "generate",
                        generate.stageVersion,
                        "decisions"
                    );
                    const artifact = await store.getJson<DecisionsArtifact>(key);
                    return artifact.isOk() && artifact.value ? artifact.value : { decisions: {} };
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionSetComponentDecision",
        dependencies: [ComponentExtractionPermissions, RunRepository, StageArtifactStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface
        ) {
            return ({ args }: { args: { runId: string; signature: string; decision: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to edit component extraction.");
                    }
                    if (!["accepted", "rejected", "none"].includes(args.decision)) {
                        throw new Error(`Unknown decision "${args.decision}".`);
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const generate = stageEntry(runResult.value.stages, "generate");
                    if (!generate || !generate.artifacts.components) {
                        throw new Error("Generate has not produced components to decide on.");
                    }
                    const key = stageArtifactKey(
                        args.runId,
                        "generate",
                        generate.stageVersion,
                        "decisions"
                    );
                    const current = await store.getJson<DecisionsArtifact>(key);
                    const decisions: Record<string, ComponentDecision> =
                        current.isOk() && current.value ? { ...current.value.decisions } : {};

                    if (args.decision === "none") {
                        delete decisions[args.signature];
                    } else {
                        decisions[args.signature] = args.decision as ComponentDecision;
                    }

                    const updated: DecisionsArtifact = { decisions };
                    const written = await store.putJson(key, updated);
                    if (written.isFail()) {
                        throw written.error;
                    }
                    return updated;
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionRenderComponents",
        dependencies: [ComponentExtractionPermissions, RunRepository, TaskService],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            taskService: TaskService.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;

                    const generate = stageEntry(run.stages, "generate");
                    if (!generate || generate.status !== "done") {
                        throw new Error("Render requires Generate to be done.");
                    }

                    const triggered = await taskService.trigger<{ runId: string }>({
                        definition: RENDER_COMPONENTS_TASK_ID,
                        name: `Component extraction — render (run ${run.runNumber})`,
                        input: { runId: run.id }
                    });
                    if (triggered.isFail()) {
                        throw triggered.error;
                    }

                    return { taskId: triggered.value.id, runId: run.id, stage: "render" };
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionRegenerateComponent",
        dependencies: [ComponentExtractionPermissions, RunRepository, TaskService],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            taskService: TaskService.Interface
        ) {
            return ({
                args
            }: {
                args: { runId: string; signature: string; instruction: string };
            }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }
                    const instruction = args.instruction.trim();
                    if (!instruction) {
                        throw new Error("An instruction is required to regenerate a component.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;

                    const generate = stageEntry(run.stages, "generate");
                    if (!generate || !generate.artifacts.components) {
                        throw new Error("Generate has not produced components to refine.");
                    }

                    const triggered = await taskService.trigger<{
                        runId: string;
                        signature: string;
                        instruction: string;
                    }>({
                        definition: REGENERATE_COMPONENT_TASK_ID,
                        name: `Component extraction — regenerate (run ${run.runNumber})`,
                        input: { runId: run.id, signature: args.signature, instruction }
                    });
                    if (triggered.isFail()) {
                        throw triggered.error;
                    }

                    return { taskId: triggered.value.id, runId: run.id, stage: "regenerate" };
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionListModelCalls",
        dependencies: [ComponentExtractionPermissions, ModelCallRepository],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            modelCalls: ModelCallRepository.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const result = await modelCalls.listByRun(args.runId);
                    const calls = result.isOk() ? result.value : [];
                    // Bodies are out of scope (W7.1) — only the accounting fields are returned.
                    return calls.map(call => ({
                        stage: call.stage,
                        name: call.name,
                        modelId: call.modelId,
                        inputTokens: call.inputTokens,
                        outputTokens: call.outputTokens,
                        latencyMs: call.latencyMs,
                        ok: call.ok,
                        createdOn: call.createdOn
                    }));
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionProjectPlanCost",
        dependencies: [ComponentExtractionPermissions, RunRepository, StageArtifactStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;

                    // How many components the plan will generate.
                    let components = 0;
                    const planKey = stageEntry(run.stages, "plan")?.artifacts.plan;
                    if (planKey) {
                        const plan = await store.getJson<PlanArtifact>(planKey);
                        if (plan.isOk() && plan.value) {
                            components = plan.value.components.length;
                        }
                    }

                    // Mean tokens per generate call, from this job's prior runs' Generate aggregates.
                    const runs = await runRepository.listByJob(run.jobId, {
                        sort: ["runNumber_DESC"]
                    });
                    let totalTokens = 0;
                    let totalCalls = 0;
                    let priorRuns = 0;
                    if (runs.isOk()) {
                        for (const prior of runs.value.runs) {
                            if (prior.id === run.id) {
                                continue;
                            }
                            const usage = stageEntry(prior.stages, "generate")?.modelUsage;
                            if (usage && usage.calls > 0) {
                                totalTokens += usage.inputTokens + usage.outputTokens;
                                totalCalls += usage.calls;
                                priorRuns++;
                            }
                        }
                    }

                    const meanTokensPerCall =
                        totalCalls > 0 ? Math.round(totalTokens / totalCalls) : null;
                    const projectedTokens =
                        meanTokensPerCall !== null
                            ? Math.round(components * meanTokensPerCall)
                            : null;

                    return { components, meanTokensPerCall, projectedTokens, priorRuns };
                });
        }
    });
};
