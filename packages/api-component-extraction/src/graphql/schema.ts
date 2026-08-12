import { ErrorResponse, Response } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { componentExtractionTypeDefs } from "./typeDefs.js";
import { ComponentExtractionPermissions } from "~/features/permissions.js";
import { JobRepository, RunLock, RunRepository } from "~/domain/abstractions.js";
import { initLedger, stageEntry } from "~/domain/ledger.js";
import {
    DEFAULT_PAGE_CAP,
    MAX_PAGE_CAP,
    previousStage,
    STAGES,
    stageTaskId,
    type Stage
} from "~/constants.js";
import { ExtractionRunInProgressError } from "~/domain/errors.js";
import type { StageTaskInput } from "~/features/stages/StageTaskRunner.js";

/** Thin resolvers: authorize, delegate, map onto the `{ data, error }` envelope. */
const resolve = async (fn: () => Promise<unknown>) => {
    try {
        return new Response(await fn());
    } catch (error) {
        return new ErrorResponse(error);
    }
};

const isStage = (value: string): value is Stage => (STAGES as readonly string[]).includes(value);

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
};
