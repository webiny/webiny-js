// Pulls in the `TaskController` augmentation so `controller.response`/`logger` exist — the same
// side-effect import component extraction's stage runner relies on.
import "@webiny/background-tasks/api/types.js";
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ComposePagesService } from "~/domain/abstractions.js";
import { COMPOSE_PAGES_TASK_ID } from "~/constants.js";

export interface ComposePagesTaskInput {
    runId: string;
}

/**
 * Composes a finished run's pages, as a background task rather than inline in the mutation: a site
 * with tens of pages means tens of page creations plus a tree read per page, which does not belong in
 * a request. One pass, no continuation — if a five-site demo ever outgrows a single invocation, the
 * checkpointing pattern the extraction stages use is the thing to copy.
 */
class ComposePagesTaskHandlerImpl implements TaskHandler.Interface<ComposePagesTaskInput> {
    constructor(private composer: ComposePagesService.Interface) {}

    async run({ input, controller }: TaskHandler.RunParams<ComposePagesTaskInput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        await controller.logger.info({
            message: `Composing Website Builder pages for run ${input.runId}.`
        });

        const result = await this.composer.execute(input.runId);
        if (result.isFail()) {
            await controller.logger.error({
                message: "Page composition failed.",
                error: result.error
            });
            return controller.response.error(result.error.message);
        }

        const { created, failed, kept, dropped } = result.value;
        await controller.logger.info({
            message: `Created and published ${created} page(s); ${failed} could not be created; ${kept.length} earlier page(s) kept live because they could not be rebuilt; ${dropped.length} unpublished because the run no longer has them.`
        });

        return controller.response.done(`Composed ${created} page(s).`);
    }
}

const ComposePagesTaskHandler = TaskHandler.createImplementation({
    implementation: ComposePagesTaskHandlerImpl,
    dependencies: [ComposePagesService]
});

class ComposePagesTaskImpl implements TaskDefinition.Interface<ComposePagesTaskInput> {
    readonly id = COMPOSE_PAGES_TASK_ID;
    readonly title = "Page composition (PoC) — compose pages";
    readonly description =
        "THROWAWAY PROOF OF CONCEPT. Creates and publishes a Website Builder page per page in a component-extraction run's Assemble output.";
    readonly maxIterations = 1;
    readonly isPrivate = false;
    readonly databaseLogs = true;

    readonly handler = ComposePagesTaskHandler;
}

export const ComposePagesTask = TaskDefinition.createImplementation({
    implementation: ComposePagesTaskImpl,
    dependencies: []
});
