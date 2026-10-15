import type { Container } from "@webiny/di";
import { createFeature, Result } from "@webiny/feature/api";
import {
    TaskService,
    type ITaskTriggerParams
} from "@webiny/api-core/features/task/TaskService/index.js";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

/** A task that keeps asking to continue is broken; stop it instead of hanging the test. */
const MAX_RUNS = 100;

/*
 * A `TaskService` that runs the triggered task right away, inside `trigger`, and keeps calling it
 * while it asks to continue. Tests then see the task's effects as soon as the triggering call
 * returns, with no task records and no step function. The controller covers what the task handlers
 * use: runtime checks (never aborted, never out of time), responses, triggering further tasks and a
 * silent logger.
 */
class InlineTaskServiceImpl implements TaskService.Interface {
    private nextId = 1;

    constructor(private container: Container) {}

    async trigger<I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput>(
        params: ITaskTriggerParams<I>
    ) {
        const definition = this.container
            .resolveAll(TaskDefinition)
            .find(candidate => candidate.id === params.definition);
        if (!definition) {
            throw new Error(`No task definition "${params.definition}" is registered.`);
        }

        const handler = this.container.resolveImplementation(definition.handler);
        const controller = this.createController();

        let input = params.input ?? ({} as I);
        for (let run = 1; run <= MAX_RUNS; run++) {
            const result = await handler.run({ input, definition, controller } as never);
            if (result.status !== TaskResultStatus.CONTINUE) {
                break;
            }
            if (run === MAX_RUNS) {
                throw new Error(
                    `Task "${definition.id}" was still continuing after ${MAX_RUNS} runs.`
                );
            }
            input = (result as { input: I }).input;
        }

        const now = new Date().toISOString();
        return Result.ok({
            id: `inline-task-${this.nextId++}`,
            definitionId: definition.id,
            input,
            createdOn: now,
            savedOn: now
        }) as never;
    }

    async abort(): Promise<never> {
        throw new Error("Inline tasks finish inside trigger(), so there is nothing to abort.");
    }

    async fetchServiceInfo() {
        return Result.ok({});
    }

    private createController() {
        return {
            runtime: {
                isAborted: () => false,
                isCloseToTimeout: () => false
            },
            response: {
                done: (message?: string, output?: unknown) => ({
                    status: TaskResultStatus.DONE,
                    message,
                    output
                }),
                continue: (input: unknown) => ({ status: TaskResultStatus.CONTINUE, input }),
                error: (error: unknown) => ({ status: TaskResultStatus.ERROR, error }),
                aborted: () => ({ status: TaskResultStatus.ABORTED })
            },
            task: {
                trigger: (params: ITaskTriggerParams) => this.trigger(params)
            },
            logger: {
                info: async () => {},
                error: async () => {},
                warn: async () => {},
                debug: async () => {}
            }
        };
    }
}

/** Registers a {@link TaskService} that runs every triggered task inline. */
export const InlineTaskServiceFeature = createFeature({
    name: "Testing/InlineTaskService",
    register(container) {
        container.registerInstance(TaskService, new InlineTaskServiceImpl(container));
    }
});
