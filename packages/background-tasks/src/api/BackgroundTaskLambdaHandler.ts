import type { Container } from "@webiny/feature/api";
import { BackgroundTaskEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/BackgroundTaskEventHandler.js";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";
import { timerFactory } from "@webiny/handler-aws/utils/index.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-aws/eventTypes/BackgroundTaskEventType.js";
import { TaskRunner } from "~/api/runner/index.js";
import { TaskEventValidation } from "~/api/runner/TaskEventValidation.js";
import type { Context } from "~/api/types.js";

class BackgroundTaskLambdaHandlerImpl implements BackgroundTaskEventHandler.Interface {
    constructor(private container: Container) {}

    async execute(
        eventCtx: EventContext<IBackgroundTaskEvent>,
        _next: NextFunction
    ): Promise<void> {
        // TODO: remove once legacy ctx is gone — resolve services directly from the container.
        const ctx: Record<string, any> = { container: this.container };
        for (const enhancer of this.container.resolveAll(GraphQLContextEnhancer)) {
            await enhancer.enhance(ctx);
        }
        for (const schema of this.container.resolveAll(GraphQLContextualSchema)) {
            await schema.build(ctx);
        }

        const runner = new TaskRunner(ctx as Context, timerFactory(), new TaskEventValidation());

        await runner.run(eventCtx.event);
    }
}

export const BackgroundTaskLambdaHandler = BackgroundTaskEventHandler.createImplementation({
    implementation: BackgroundTaskLambdaHandlerImpl,
    dependencies: [RequestContainer]
});
