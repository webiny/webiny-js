import { ErrorResponse, Response } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { RunRepository } from "@webiny/api-component-extraction/domain/abstractions.js";
import { ComponentExtractionPermissions } from "@webiny/api-component-extraction/features/permissions.js";
import { stageEntry } from "@webiny/api-component-extraction/domain/ledger.js";
import { PageMapStore } from "~/domain/abstractions.js";
import { COMPOSE_PAGES_TASK_ID } from "~/constants.js";
import { pageCompositionTypeDefs } from "./typeDefs.js";
import type { ComposePagesTaskInput } from "~/features/ComposePagesTask.js";

/** Thin resolvers: authorize, delegate, map onto the `{ data, error }` envelope. */
const resolve = async (fn: () => Promise<unknown>) => {
    try {
        return new Response(await fn());
    } catch (error) {
        return new ErrorResponse(error);
    }
};

export const addPageCompositionSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(pageCompositionTypeDefs);

    builder.addResolver({
        path: "Mutation.pageCompositionPocComposePages",
        dependencies: [ComponentExtractionPermissions, RunRepository, TaskService],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            taskService: TaskService.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    // The PoC has no permission of its own: composing pages from a run is an
                    // extraction operator's act, and a throwaway package should not leave a
                    // permission behind in the system when it goes.
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }

                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;

                    const assemble = stageEntry(run.stages, "assemble");
                    if (!assemble || assemble.status !== "done") {
                        throw new Error("Page composition requires Assemble to be done.");
                    }
                    const promote = stageEntry(run.stages, "promote");
                    if (!promote || promote.status !== "done") {
                        throw new Error(
                            "Page composition requires Promote to be done — a page addresses a component by the name it was promoted under."
                        );
                    }

                    const triggered = await taskService.trigger<ComposePagesTaskInput>({
                        definition: COMPOSE_PAGES_TASK_ID,
                        name: `Page composition (PoC) — run ${run.runNumber}`,
                        input: { runId: run.id }
                    });
                    if (triggered.isFail()) {
                        throw triggered.error;
                    }

                    return { taskId: triggered.value.id, runId: run.id };
                });
        }
    });

    builder.addResolver({
        path: "Query.pageCompositionPocPageMap",
        dependencies: [ComponentExtractionPermissions, PageMapStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            pageMaps: PageMapStore.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to read component extraction.");
                    }

                    const result = await pageMaps.get(args.runId);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
        }
    });
};
