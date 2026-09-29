import type { Container, Constructor } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core/features/events/RequestContainer.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskHandlerResolver as Abstraction } from "./abstractions.js";

class ContainerTaskHandlerResolver implements Abstraction.Interface {
    public constructor(private readonly container: Container) {}

    public resolve<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    >(handler: Constructor<TaskDefinition.Handler<I, O>>): TaskDefinition.Handler<I, O> {
        // `resolveImplementation` builds the class from its own dependency metadata and runs it
        // through the normal resolution path, so decorators registered against the handler still
        // apply. It deliberately ignores registrations, which is what we want here: the definition
        // names the class directly and nothing registers handlers against an abstraction.
        return this.container.resolveImplementation(handler);
    }
}

export const TaskHandlerResolver = Abstraction.createImplementation({
    implementation: ContainerTaskHandlerResolver,
    dependencies: [RequestContainer]
});
