import { randomUUID } from "node:crypto";
import {
    ChildContainerFactory,
    HandlerConfig,
    HandlerExecutionRunner,
    RootContainerFactory
} from "./abstractions.js";
import { HandlerExecutionScope } from "./HandlerExecutionScope.js";
import { dispatchEvent } from "./dispatchEvent.js";
import type { Transport } from "./Transport.js";

function createExecutionId(transport: Transport | undefined, rawArgs: any[]): string {
    const platformId = transport?.getExecutionId?.(...rawArgs);
    return platformId || randomUUID();
}

class HandlerExecutionRunnerImpl implements HandlerExecutionRunner.Interface {
    constructor(
        private readonly config: HandlerConfig.Interface,
        private readonly rootContainerFactory: RootContainerFactory.Interface,
        private readonly childContainerFactory: ChildContainerFactory.Interface,
        private readonly scope: HandlerExecutionScope.Interface
    ) {}

    async execute(rawArgs: any[]): Promise<any> {
        /*
         * The root container lives for the whole process, so it is built outside any execution's
         * scope: anything long-lived it starts must not carry the first execution's id.
         */
        const root = await this.rootContainerFactory.get();
        const executionId = createExecutionId(this.config.transport, rawArgs);

        // Everything from here on, building the execution's container included, runs in its scope.
        return this.scope.run(executionId, async () => {
            const child = await this.childContainerFactory.create(root, rawArgs);
            // The event to match on is always the first raw argument (transports never change this).
            const event = rawArgs[0];

            return dispatchEvent(child, event);
        });
    }
}

export const DefaultHandlerExecutionRunner = HandlerExecutionRunner.createImplementation({
    implementation: HandlerExecutionRunnerImpl,
    dependencies: [
        HandlerConfig,
        RootContainerFactory,
        ChildContainerFactory,
        HandlerExecutionScope
    ]
});
