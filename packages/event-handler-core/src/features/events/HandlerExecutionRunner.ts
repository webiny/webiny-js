import { ChildContainerFactory } from "./abstractions.js";
import { HandlerExecutionRunner } from "./abstractions.js";
import { RootContainerFactory } from "./abstractions.js";
import { HandlerExecutionScope } from "./HandlerExecutionScope.js";
import { HandlerPlatform } from "./HandlerPlatform.js";
import { EventType } from "./EventType.js";
import { NoMatchingEventTypeError } from "./NoMatchingEventTypeError.js";
import { executeChain } from "./chain.js";
import { createExecutionId } from "./createExecutionId.js";

class HandlerExecutionRunnerImpl implements HandlerExecutionRunner.Interface {
    constructor(
        private readonly rootContainerFactory: RootContainerFactory.Interface,
        private readonly childContainerFactory: ChildContainerFactory.Interface,
        private readonly scope: HandlerExecutionScope.Interface,
        private readonly platform: HandlerPlatform.Interface
    ) {}

    async execute(rawArgs: any[]): Promise<any> {
        /*
         * The root container lives for the whole process, so it is built outside any execution's
         * scope: anything long-lived it starts must not carry the first execution's id.
         */
        const root = await this.rootContainerFactory.get();
        const platformId = this.platform.getExecutionId(rawArgs);
        const executionId = createExecutionId(platformId);

        // Everything from here on, building the execution's container included, runs in its scope.
        return this.scope.run(executionId, async () => {
            const child = await this.childContainerFactory.create(root, rawArgs);
            // The event to match on is always the first raw argument (platforms never change this).
            const event = rawArgs[0];
            const eventTypes = child.resolveAll(EventType);
            const matched = eventTypes.find(eventType => eventType.canHandle(event));

            if (!matched) {
                throw new NoMatchingEventTypeError(event, eventTypes);
            }

            const abstraction = matched.getHandlerAbstraction();
            const handlers = child.resolveAll(abstraction);

            return executeChain(handlers, event);
        });
    }
}

export const DefaultHandlerExecutionRunner = HandlerExecutionRunner.createImplementation({
    implementation: HandlerExecutionRunnerImpl,
    dependencies: [
        RootContainerFactory,
        ChildContainerFactory,
        HandlerExecutionScope,
        HandlerPlatform
    ]
});
