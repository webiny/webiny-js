import { createAbstraction } from "@webiny/feature/api";
import type { Constructor } from "@webiny/di";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface ITaskHandlerResolver {
    resolve<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    >(
        handler: Constructor<TaskDefinition.Handler<I, O>>
    ): TaskDefinition.Handler<I, O>;
}

/**
 * Builds the behaviour half of a task on demand.
 *
 * Something has to turn `definition.handler` (a class) into an instance, and that needs the
 * container. Rather than injecting the container into a use case — which is the service-locator
 * pattern we keep out of DI classes — it lives behind this one narrow abstraction. Everything else
 * depends on `resolve(handler)` and stays testable with a stub.
 */
export const TaskHandlerResolver = createAbstraction<ITaskHandlerResolver>(
    "Tasks/TaskHandlerResolver"
);

export namespace TaskHandlerResolver {
    export type Interface = ITaskHandlerResolver;
}
