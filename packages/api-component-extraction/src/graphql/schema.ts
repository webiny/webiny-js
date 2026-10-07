import { ErrorResponse, Response } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TasksCrud } from "@webiny/background-tasks/api/TasksCrud.js";
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
import {
    hasOutstandingClaim,
    initLedger,
    isClaimStale,
    withoutStageClaim,
    markStageFailed,
    markStaleFrom,
    stageEntry,
    withStageClaim
} from "~/domain/ledger.js";
import type {
    ClassifyArtifact,
    SegmentArtifact,
    ClusterArtifact,
    ComponentDecision,
    GenerateArtifact,
    PlanArtifact
} from "~/domain/artifacts.js";
import { readComponent } from "~/domain/generatedComponents.js";
import { buildComponentPrompt } from "~/features/stages/generate/componentGeneration.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import type { Correction, Run } from "~/domain/types.js";
import {
    DEFAULT_PAGE_CAP,
    MAX_PAGE_CAP,
    GENERATE_COMPONENT_TASK_ID,
    previousStage,
    REGENERATE_COMPONENT_TASK_ID,
    REGENERATE_PLAN_TASK_ID,
    RECAPTURE_PAGES_TASK_ID,
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
import type { GenerateComponentTaskInput } from "~/features/stages/generate/GenerateComponentTask.js";
import { OverrideApplicator, stageArtifactName } from "~/features/shared/OverrideApplicator.js";
import { decisionsFromOverrides, normalizeUrl } from "~/domain/overrides.js";
import {
    latestReviews,
    parseReview,
    REVIEW_KIND,
    REVIEW_REASON_LABELS,
    REVIEW_REASONS,
    REVIEW_VERDICT_LABELS,
    REVIEW_VERDICTS,
    type ReviewedOutput
} from "~/domain/review.js";
import { checkReachability } from "~/features/shared/reachability.js";
import { ListRemoteComponentsUseCase } from "@webiny/remote-components/api/features/listComponents/abstractions.js";

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
    if (stage === "segment") {
        /*
         * A parameter override has no per-item signature, so the machine value worth logging is what
         * the stage actually ran with — which is the whole point of the log for a tuned number.
         */
        const value = (artifact as SegmentArtifact).maxSectionHeight;
        return typeof value === "number" ? { maxSectionHeight: value } : null;
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
    /*
     * A failed apply used to be swallowed — `if (applied.isOk())` with no else — so the correction was
     * stored, the downstream stages were marked stale, and the mutation returned success while the
     * stage's effective output was untouched or reverted. The operator had no signal at all, which is
     * the worst shape this tool can fail in: the gates exist to hold their tuning.
     *
     * Throwing puts it on the `{ data, error }` envelope with the reason. The correction row stays —
     * it is a durable job override and re-applies on the next run — so the state is "recorded but not
     * applied", which is what the message says.
     */
    if (applied.isFail()) {
        throw applied.error;
    }
    let stages = run.stages.map(current =>
        current.stage === stage ? { ...current, artifacts: applied.value.artifacts } : current
    );
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
        path: "Mutation.componentExtractionCancelRun",
        dependencies: [ComponentExtractionPermissions, RunRepository, RunLock, TaskService],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            runLock: RunLock.Interface,
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

                    if (run.status === "cancelled") {
                        throw new Error("This run has already been cancelled.");
                    }
                    if (run.status === "done") {
                        throw new Error(
                            "This run has finished, so there is nothing to cancel. It is not holding the job's run slot."
                        );
                    }

                    /*
                     * Abort the in-flight task first, and best-effort: the run is being abandoned
                     * either way, and a task that cannot be reached — already dead, which is the
                     * usual reason for cancelling — must not block the release below. What matters
                     * is the lock; stopping the task only saves it doing work nobody will read.
                     */
                    const running = run.stages.find(entry => entry.status === "running");
                    if (running?.taskId) {
                        await taskService.abort({
                            id: running.taskId,
                            message: `Run ${run.id} was cancelled.`
                        });
                    }

                    /*
                     * A stage left "running" on an abandoned run would read as still working forever.
                     * It is recorded as not having finished rather than as a new "cancelled" stage
                     * status: the stage genuinely did not complete, the message says why, and the
                     * distinction that matters — deliberate versus broken — belongs on the run.
                     */
                    const stages = running
                        ? markStageFailed(
                              run.stages,
                              running.stage,
                              "Cancelled before it finished.",
                              new Date().toISOString()
                          )
                        : run.stages;

                    const updated = await runRepository.update(run.id, {
                        stages,
                        status: "cancelled"
                    });
                    if (updated.isFail()) {
                        throw updated.error;
                    }

                    /*
                     * Last, and only after the status is persisted. Releasing first would let a new
                     * run start against a job whose old run still reads as in flight, and the lock is
                     * the thing this mutation exists to free — if the update above failed, the run
                     * must stay locked rather than leave two runs believing they hold the job.
                     */
                    const released = await runLock.release(run.jobId, run.id);
                    if (released.isFail()) {
                        throw released.error;
                    }

                    return updated.value;
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionRunStage",
        dependencies: [ComponentExtractionPermissions, RunRepository, TaskService, TasksCrud],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            taskService: TaskService.Interface,
            tasks: TasksCrud.Interface
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
                    let run = runResult.value;

                    /*
                     * A cancelled run is over. Without this it would still accept stages, which makes
                     * the status a label rather than a state — and worse, cancelling released the
                     * job's run slot, so a restarted run would be in flight holding nothing while
                     * another run legitimately took the lock.
                     */
                    if (run.status === "cancelled") {
                        throw new Error(
                            "This run was cancelled. Start a new run for the job rather than restarting this one."
                        );
                    }

                    /*
                     * Predecessor enforcement: the stage before this one must be done AND its
                     * recorded artifacts must belong to the version it claims.
                     *
                     * The version check is not redundant. A stage writes its artifact refs and its
                     * version together, but a torn or partially-merged ledger can leave an entry
                     * claiming v2 while still pointing at v1's artifact — and a consumer reading
                     * that produces plausible output from the wrong input, which is the worst thing
                     * this pipeline can do. Refusing is cheap; a five-site run cannot afford a stage
                     * that quietly consumed the previous version.
                     */
                    const previous = previousStage(stage);
                    if (previous) {
                        const previousEntry = stageEntry(run.stages, previous);
                        if (!previousEntry || previousEntry.status !== "done") {
                            const state = previousEntry?.status ?? "not started";
                            throw new Error(
                                `Cannot run "${stage}" before "${previous}" is done (it is ${state}).`
                            );
                        }

                        if (hasOutstandingClaim(previousEntry)) {
                            /*
                             * A claim only means "a newer run of this stage is about to start" while
                             * its task can still start. One whose task finished, failed or was aborted
                             * never will — left alone it refuses every later stage for good, which is
                             * what stranded a whole run's Assemble and Promote. Such a claim is cleared
                             * and the trigger proceeds; a live one is still respected.
                             */
                            const claimedBy = await tasks
                                .getTask(previousEntry.pendingTaskId as string)
                                .catch(() => null);
                            if (!isClaimStale(claimedBy?.taskStatus)) {
                                throw new Error(
                                    `Cannot run "${stage}": "${previous}" has just been triggered and ` +
                                        `has not started yet. Wait for it to finish.`
                                );
                            }
                            const cleared = await runRepository.update(run.id, {
                                stages: withoutStageClaim(run.stages, previous)
                            });
                            if (cleared.isFail()) {
                                throw cleared.error;
                            }
                            run = cleared.value;
                        }

                        const expected = `:v${previousEntry.stageVersion}:`;
                        const mismatched = Object.entries(previousEntry.artifacts).filter(
                            ([, ref]) => !ref.includes(expected)
                        );
                        if (mismatched.length > 0) {
                            throw new Error(
                                `Cannot run "${stage}": "${previous}" reports version ` +
                                    `${previousEntry.stageVersion} but its ${mismatched[0]![0]} ` +
                                    `artifact is from another version. Re-run "${previous}".`
                            );
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

                    /*
                     * Record the trigger before returning, so a dependent stage triggered a moment
                     * later can see that this one is in flight.
                     *
                     * Without it there is a window between "trigger accepted" and "the task marks
                     * itself running" in which the stage still reads `done` from its PREVIOUS run.
                     * Triggering Segment and then Cluster within a second or two put Cluster on the
                     * old sections: 40 members against 43, every page short by exactly its header,
                     * and a full model run spent on it with nothing to show anything was wrong.
                     *
                     * It is a claim rather than a status change on purpose — `mergeLedgers` refuses a
                     * `done → pending` write, because that is how a zombie task reverts a stage.
                     */
                    const marked = await runRepository.update(run.id, {
                        stages: withStageClaim(run.stages, stage, triggered.value.id)
                    });
                    if (marked.isFail()) {
                        throw marked.error;
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
        path: "Query.componentExtractionGetGeneratedComponent",
        dependencies: [ComponentExtractionPermissions, RunRepository, StageArtifactStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface
        ) {
            return ({ args }: { args: { runId: string; signature: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const generate = stageEntry(runResult.value.stages, "generate");
                    const componentsKey = generate?.artifacts.components;
                    if (!componentsKey) {
                        return null;
                    }
                    const artifact = await store.getJson<GenerateArtifact>(componentsKey);
                    if (artifact.isFail() || !artifact.value) {
                        return null;
                    }
                    const entry = artifact.value.components.find(
                        component => component.signature === args.signature
                    );
                    if (!entry) {
                        return null;
                    }
                    // One component, resolved through the same path every other consumer uses — so an
                    // artifact written before the aggregate referenced its components still reads.
                    const component = await readComponent(store, entry);
                    return component.isOk() ? component.value : null;
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionGetComponentPrompt",
        dependencies: [
            ComponentExtractionPermissions,
            RunRepository,
            JobRepository,
            StageArtifactStore,
            ThemeManifestResolver
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            jobRepository: JobRepository.Interface,
            store: StageArtifactStore.Interface,
            manifestResolver: ThemeManifestResolver.Interface
        ) {
            return ({ args }: { args: { runId: string; signature: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;
                    const planKey = stageEntry(run.stages, "plan")?.artifacts.plan;
                    if (!planKey) {
                        return null;
                    }
                    const plan = await store.getJson<PlanArtifact>(planKey);
                    if (plan.isFail() || !plan.value) {
                        return null;
                    }
                    const planned = plan.value.components.find(
                        component => component.signature === args.signature
                    );
                    if (!planned) {
                        return null;
                    }

                    /*
                     * The same inputs `GenerateComponentTask` assembles. An unresolved theme is not an
                     * error here — the stage generates without token-binding validation in that case,
                     * so the prompt it would send is the one built from an empty variable map, and
                     * showing it is more useful than showing nothing.
                     */
                    const slotVariables = new Map<string, string[]>();
                    let themeError: string | null = null;
                    const job = await jobRepository.get(run.jobId);
                    if (job.isOk()) {
                        const manifest = await manifestResolver.resolve(
                            job.value.themeEntryId,
                            job.value.themeVersion
                        );
                        if (manifest.isOk()) {
                            for (const slot of manifest.value.slots) {
                                slotVariables.set(String(slot.path), slot.cssVariables);
                            }
                        } else {
                            themeError = manifest.error.message;
                        }
                    } else {
                        themeError = job.error.message;
                    }

                    return {
                        signature: args.signature,
                        name: planned.name,
                        prompt: buildComponentPrompt(planned, slotVariables),
                        /** Null unless the theme could not be resolved, in which case the prompt has no variables. */
                        themeError
                    };
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
            return ({ args }: { args: { runId: string; stage: string; machine?: boolean } }) =>
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
                    /*
                     * Resolve by NAME. This used to take `Object.values(artifacts)[0]`, i.e. whichever
                     * ref happened to sit first in the map's key order — so once a correction added a
                     * `<name>.machine` sibling, the stage view showed the effective or the machine
                     * artifact depending on JSON insertion order, which a ledger round-trip is free to
                     * change. That is what made corrections look as though they had not applied: the
                     * apply was fine, the read was a coin flip.
                     *
                     * The primary ref is the effective (overridden) artifact and lives at the stage's
                     * artifact name; `machine` returns the un-overridden sibling, falling back to the
                     * primary when no override has been applied.
                     */
                    const artifacts = entry?.artifacts ?? {};
                    const name = stageArtifactName(args.stage);
                    const primaryKey = name ? artifacts[name] : undefined;
                    const machineRef = name ? artifacts[`${name}.machine`] : undefined;
                    const key =
                        (args.machine ? (machineRef ?? primaryKey) : primaryKey) ??
                        // Stages without an applier (and anything written before names were stable)
                        // carry a single ref, so there is nothing to disambiguate.
                        Object.values(artifacts)[0];
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
        path: "Query.componentExtractionListLibraryNames",
        dependencies: [ComponentExtractionPermissions, ListRemoteComponentsUseCase],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            listComponents: ListRemoteComponentsUseCase.Interface
        ) {
            return () =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to view component extraction.");
                    }
                    const result = await listComponents.execute();
                    return result.isOk() ? result.value.items.map(item => item.name) : [];
                });
        }
    });

    builder.addResolver({
        path: "Query.componentExtractionCheckReachability",
        dependencies: [ComponentExtractionPermissions],
        resolver(permissions: ComponentExtractionPermissions.Interface) {
            return ({ args }: { args: { url: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }
                    return checkReachability(args.url);
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
                    // An artifact override edits a stage's output, so that stage must have run. A stage
                    // without an applier (Promote selection/collision) is a pre-run choice, allowed anytime.
                    const name = stageArtifactName(stage);
                    if (name && (!entry || (entry.status !== "done" && entry.status !== "stale"))) {
                        throw new Error(`Run "${stage}" before correcting it.`);
                    }

                    // Capture the machine value for the affected item for the correction log (W8.2).
                    let machineValue: unknown = null;
                    if (name && entry) {
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
                        stageVersion: entry?.stageVersion ?? 0,
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
        path: "Mutation.componentExtractionRecapturePages",
        dependencies: [ComponentExtractionPermissions, RunRepository, TaskService],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            taskService: TaskService.Interface
        ) {
            return ({ args }: { args: { runId: string; urls: string[] } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;

                    const capture = stageEntry(run.stages, "capture");
                    if (!capture || (capture.status !== "done" && capture.status !== "stale")) {
                        throw new Error("Capture has not produced pages to re-capture.");
                    }
                    if (args.urls.length === 0) {
                        throw new Error("Select at least one page to re-capture.");
                    }

                    const triggered = await taskService.trigger<{
                        runId: string;
                        urls: string[];
                        attempt: string;
                    }>({
                        definition: RECAPTURE_PAGES_TASK_ID,
                        name: `Component extraction — re-capture ${args.urls.length} page(s) (run ${run.runNumber})`,
                        input: {
                            // Stamps this press, so a second press restarts rather than resuming a
                            // finished attempt — see `RecaptureTaskInput.attempt`.
                            attempt: new Date().toISOString(),
                            runId: run.id,
                            urls: args.urls
                        }
                    });
                    if (triggered.isFail()) {
                        throw triggered.error;
                    }

                    return { taskId: triggered.value.id, runId: run.id, stage: "capture" };
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionExcludeCapturedPages",
        dependencies: [
            ComponentExtractionPermissions,
            RunRepository,
            OverrideRepository,
            CorrectionRepository,
            OverrideApplicator
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            overrides: OverrideRepository.Interface,
            corrections: CorrectionRepository.Interface,
            applicator: OverrideApplicator.Interface
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
                    if (!capture || (capture.status !== "done" && capture.status !== "stale")) {
                        throw new Error("Capture has not produced pages to edit.");
                    }

                    // Page exclusion is now a job override keyed by normalised URL (W8): it reattaches on
                    // every run, filters the captured pages via the applicator, and cascades to Segment.
                    for (const url of args.urls) {
                        const signature = normalizeUrl(url);
                        const upserted = await overrides.upsert({
                            jobId: run.jobId,
                            stage: "capture",
                            structuralSignature: signature,
                            correction: { kind: "page.exclude" },
                            originRunId: run.id
                        });
                        if (upserted.isFail()) {
                            throw upserted.error;
                        }
                        await corrections.create({
                            runId: run.id,
                            jobId: run.jobId,
                            stage: "capture",
                            stageVersion: capture.stageVersion,
                            signature,
                            kind: "page.exclude",
                            machineValue: { url },
                            humanValue: { kind: "page.exclude" }
                        });
                    }

                    await reapplyStage(applicator, runRepository, run, "capture");
                    const updated = await runRepository.get(run.id);
                    if (updated.isFail()) {
                        throw updated.error;
                    }
                    return updated.value;
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
        dependencies: [ComponentExtractionPermissions, RunRepository, OverrideRepository],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            overrides: OverrideRepository.Interface
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
                    // Decisions are now generate.decision overrides on the job (W8), so they reattach.
                    const list = await overrides.listByJob(runResult.value.jobId);
                    return { decisions: list.isOk() ? decisionsFromOverrides(list.value) : {} };
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionSetComponentDecision",
        dependencies: [
            ComponentExtractionPermissions,
            RunRepository,
            OverrideRepository,
            CorrectionRepository
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            overrides: OverrideRepository.Interface,
            corrections: CorrectionRepository.Interface
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
                    const run = runResult.value;
                    const generate = stageEntry(run.stages, "generate");
                    if (!generate || !generate.artifacts.components) {
                        throw new Error("Generate has not produced components to decide on.");
                    }

                    if (args.decision === "none") {
                        // Clear the decision override for this component.
                        const list = await overrides.listByJob(run.jobId);
                        const target = list.isOk()
                            ? list.value.find(
                                  override =>
                                      override.stage === "generate" &&
                                      override.structuralSignature === args.signature &&
                                      override.correction.kind === "generate.decision"
                              )
                            : undefined;
                        if (target) {
                            await overrides.delete(target.id);
                        }
                    } else {
                        const upserted = await overrides.upsert({
                            jobId: run.jobId,
                            stage: "generate",
                            structuralSignature: args.signature,
                            correction: {
                                kind: "generate.decision",
                                decision: args.decision as ComponentDecision
                            },
                            originRunId: run.id
                        });
                        if (upserted.isFail()) {
                            throw upserted.error;
                        }
                        await corrections.create({
                            runId: run.id,
                            jobId: run.jobId,
                            stage: "generate",
                            stageVersion: generate.stageVersion,
                            signature: args.signature,
                            kind: "generate.decision",
                            machineValue: null,
                            humanValue: { decision: args.decision }
                        });
                    }

                    const list = await overrides.listByJob(run.jobId);
                    return { decisions: list.isOk() ? decisionsFromOverrides(list.value) : {} };
                });
        }
    });

    /*
     * Human review verdicts (the measure Realpage reads). Logged only: a verdict is a correction-log
     * entry, never an override, so it changes nothing Promote moves and does not carry to the job's
     * next run. Each is bound to the content hash of the output it was given on.
     */
    const reviewsOf = async (
        store: StageArtifactStore.Interface,
        corrections: CorrectionRepository.Interface,
        run: Run
    ) => {
        const componentsKey = stageEntry(run.stages, "generate")?.artifacts.components;
        const artifact = componentsKey
            ? await store.getJson<GenerateArtifact>(componentsKey)
            : null;
        const refs = new Map(
            (artifact?.isOk() ? (artifact.value?.components ?? []) : []).map(ref => [
                ref.signature,
                ref
            ])
        );
        const logged = await corrections.listByRun(run.id, REVIEW_KIND);
        if (logged.isFail()) {
            throw logged.error;
        }
        return {
            reviews: latestReviews(logged.value, signature => refs.get(signature)?.contentSha256),
            verdicts: REVIEW_VERDICTS.map(value => ({
                value,
                label: REVIEW_VERDICT_LABELS[value]
            })),
            reasons: REVIEW_REASONS.map(value => ({ value, label: REVIEW_REASON_LABELS[value] }))
        };
    };

    builder.addResolver({
        path: "Query.componentExtractionGetReviews",
        dependencies: [
            ComponentExtractionPermissions,
            RunRepository,
            StageArtifactStore,
            CorrectionRepository
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface,
            corrections: CorrectionRepository.Interface
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
                    return reviewsOf(store, corrections, runResult.value);
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionSetComponentReview",
        dependencies: [
            ComponentExtractionPermissions,
            RunRepository,
            StageArtifactStore,
            CorrectionRepository
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface,
            corrections: CorrectionRepository.Interface
        ) {
            return ({
                args
            }: {
                args: {
                    runId: string;
                    signature: string;
                    verdict: string;
                    reasons?: string[] | null;
                    note?: string | null;
                };
            }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to edit component extraction.");
                    }
                    const review = parseReview(args);
                    if (typeof review === "string") {
                        throw new Error(review);
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;
                    const generate = stageEntry(run.stages, "generate");
                    const artifact = generate?.artifacts.components
                        ? await store.getJson<GenerateArtifact>(generate.artifacts.components)
                        : null;
                    const ref = artifact?.isOk()
                        ? artifact.value?.components.find(
                              component => component.signature === args.signature
                          )
                        : undefined;
                    if (!generate || !ref) {
                        throw new Error("There is no generated component to review.");
                    }
                    const reviewed: ReviewedOutput = {
                        contentSha256: ref.contentSha256,
                        revision: ref.revision
                    };
                    const created = await corrections.create({
                        runId: run.id,
                        jobId: run.jobId,
                        stage: "generate",
                        stageVersion: generate.stageVersion,
                        signature: args.signature,
                        kind: REVIEW_KIND,
                        machineValue: reviewed,
                        humanValue: review
                    });
                    if (created.isFail()) {
                        throw created.error;
                    }
                    return reviewsOf(store, corrections, run);
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
            return ({ args }: { args: { runId: string; signature?: string } }) =>
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

                    const triggered = await taskService.trigger<{
                        runId: string;
                        attempt: string;
                        signatures?: string[];
                    }>({
                        definition: RENDER_COMPONENTS_TASK_ID,
                        name: `Component extraction — render (run ${run.runNumber})`,
                        input: {
                            // Stamps this press, so a retry restarts rather than
                            // resuming a finished attempt — see `RenderTaskInput.attempt`.
                            attempt: new Date().toISOString(),
                            runId: run.id,
                            /*
                             * The one component, when one was asked for. The argument was accepted and
                             * dropped here, so "Re-render" on a single card re-rendered the whole run
                             * — correct output at many times the cost, which is the kind of defect
                             * nothing reports because nothing is wrong with the result.
                             */
                            ...(args.signature ? { signatures: [args.signature] } : {})
                        }
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

    /*
     * Generate selected components again, through Generate itself: the same prompt, validation and
     * retries as the stage, not the refine path. For checking a change to generation on the components
     * it is about, at the cost of those components rather than of a whole run. Each runs as its own
     * component task, all at once, and replaces its component in the finished stage.
     */
    builder.addResolver({
        path: "Mutation.componentExtractionGenerateComponents",
        dependencies: [
            ComponentExtractionPermissions,
            RunRepository,
            StageArtifactStore,
            TaskService
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            store: StageArtifactStore.Interface,
            taskService: TaskService.Interface
        ) {
            return ({ args }: { args: { runId: string; signatures: string[] } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }
                    const signatures = [...new Set(args.signatures)];
                    if (signatures.length === 0) {
                        throw new Error("Select at least one component to generate.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;
                    const generate = stageEntry(run.stages, "generate");
                    const componentsKey = generate?.artifacts.components;
                    if (!generate || generate.status !== "done" || !componentsKey) {
                        throw new Error(
                            "Generate has to have finished before selected components can be generated again."
                        );
                    }
                    const planRef = stageEntry(run.stages, "plan")?.artifacts.plan;
                    const plan = planRef ? await store.getJson<PlanArtifact>(planRef) : null;
                    if (!planRef || !plan?.isOk() || !plan.value) {
                        throw new Error("The run's plan could not be read.");
                    }
                    const planned = new Map(
                        plan.value.components.map(component => [component.signature, component])
                    );
                    const unknown = signatures.filter(signature => !planned.has(signature));
                    if (unknown.length > 0) {
                        throw new Error(`Not in the run's plan: ${unknown.join(", ")}.`);
                    }

                    const tasks: { signature: string; taskId: string }[] = [];
                    for (const signature of signatures) {
                        const triggered = await taskService.trigger<GenerateComponentTaskInput>({
                            definition: GENERATE_COMPONENT_TASK_ID,
                            name: `Generate again: ${planned.get(signature)!.name}`,
                            input: {
                                runId: run.id,
                                signature,
                                stageVersion: generate.stageVersion,
                                planRef,
                                replaceInto: { componentsKey }
                            }
                        });
                        if (triggered.isFail()) {
                            throw triggered.error;
                        }
                        tasks.push({ signature, taskId: triggered.value.id });
                    }
                    return { tasks };
                });
        }
    });

    builder.addResolver({
        path: "Mutation.componentExtractionRegeneratePlan",
        dependencies: [ComponentExtractionPermissions, RunRepository, TaskService],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            taskService: TaskService.Interface
        ) {
            return ({
                args
            }: {
                args: { runId: string; signature: string; instruction?: string };
            }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;

                    const plan = stageEntry(run.stages, "plan");
                    if (!plan || !plan.artifacts.plan) {
                        throw new Error("Plan has not produced a contract to regenerate.");
                    }

                    const instruction = args.instruction?.trim() || undefined;
                    const triggered = await taskService.trigger<{
                        runId: string;
                        signature: string;
                        instruction?: string;
                    }>({
                        definition: REGENERATE_PLAN_TASK_ID,
                        name: `Component extraction — regenerate plan (run ${run.runNumber})`,
                        input: { runId: run.id, signature: args.signature, instruction }
                    });
                    if (triggered.isFail()) {
                        throw triggered.error;
                    }

                    return { taskId: triggered.value.id, runId: run.id, stage: "regenerate-plan" };
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
                        stageVersion: call.stageVersion,
                        name: call.name,
                        modelId: call.modelId,
                        signature: call.signature,
                        inputTokens: call.inputTokens,
                        outputTokens: call.outputTokens,
                        cacheReadTokens: call.cacheReadTokens,
                        cacheWriteTokens: call.cacheWriteTokens,
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
