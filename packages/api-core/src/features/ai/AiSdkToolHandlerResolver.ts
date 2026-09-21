import type { Container, Constructor } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core/features/events/RequestContainer.js";
import { AiSdkToolHandler, AiSdkToolHandlerResolver as Abstraction } from "./abstractions.js";

class ContainerAiSdkToolHandlerResolver implements Abstraction.Interface {
    constructor(private readonly container: Container) {}

    resolve<TInput>(
        handler: Constructor<AiSdkToolHandler.Interface<TInput>>
    ): AiSdkToolHandler.Interface<TInput> {
        /*
         * `resolveImplementation` builds the class from its own dependency metadata and runs it
         * through the normal resolution path, so decorators registered against the handler still
         * apply. It deliberately ignores registrations, which is what we want here: the tool names
         * the class directly and nothing registers handlers against an abstraction.
         */
        return this.container.resolveImplementation(handler);
    }
}

export const AiSdkToolHandlerResolver = Abstraction.createImplementation({
    implementation: ContainerAiSdkToolHandlerResolver,
    dependencies: [RequestContainer]
});
