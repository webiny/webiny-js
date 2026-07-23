import type { Container } from "@webiny/feature/api";
import { AwsLambdaContext } from "@webiny/event-handler-aws/abstractions/AwsLambdaContext.js";
import { BackgroundTaskEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/BackgroundTaskEventHandler.js";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/api-graphql";
import { RequestContainer, runRequestContextInitializers } from "@webiny/event-handler-core";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-aws/eventTypes/BackgroundTaskEventType.js";
import { TaskRunner } from "@webiny/background-tasks/api/runner/index.js";
import { TaskEventValidation } from "@webiny/background-tasks/api/runner/TaskEventValidation.js";
import type { Context } from "@webiny/background-tasks/api/types.js";
import { LambdaTimer } from "~/timer/LambdaTimer.js";

/* Fallback ceiling used when there is no real Lambda context to read the remaining time from
 * (mirrors the default Lambda timeout budget handler-aws's CustomTimer uses). */
const FALLBACK_MAX_RUNNING_MILLISECONDS = 14 * 60 * 1000;

class BackgroundTaskLambdaHandlerImpl implements BackgroundTaskEventHandler.Interface {
    constructor(private container: Container) {}

    async execute(
        eventCtx: EventContext<IBackgroundTaskEvent>,
        _next: NextFunction
    ): Promise<unknown> {
        // Date-based fallback in case there is no real Lambda context (see below) — captured up
        // front so the fallback countdown starts at the beginning of this invocation.
        const fallbackStartTime = Date.now();
        // The SFN/EventBridge transport wraps the task as `{ name, payload }`; TaskRunner expects the
        // flat task event (webinyTaskId at top level), so unwrap `payload` (falling back to the event
        // itself if it's already flat).
        const taskEvent = (eventCtx.event as any)?.payload || eventCtx.event;

        // Background tasks have no HTTP request establisher. This is the bg-task EXTRACT step: put the
        // tenant id from the task event into RawTenantId, then run the shared LOAD step
        // (RequestTenantLoader) — same tenant-establishment path as every other transport. The
        // CRUD (TasksCrud) and downstream use cases resolve the current tenant, so it must be set
        // before the task runs.
        if (taskEvent?.tenant) {
            this.container.resolve(RawTenantId).set(taskEvent.tenant);
            await this.container.resolve(RequestTenantLoader).establish();
        }

        // Run the post-context initializers (register TasksCrud, FileModel, etc.). The HTTP layer does
        // this via RequestContextInitializerDecorator; the bg-task chain must do it too, before the
        // task runs — otherwise TaskControl can't resolve TasksCrud. continueOnError: a task doesn't
        // need every HTTP initializer (e.g. ACO/scheduler), and some throw in the bg-task context —
        // skip+log those so they don't fail the task, while TasksCrud/FileModel still register.
        await runRequestContextInitializers(this.container, { continueOnError: true });

        // TODO: remove once legacy ctx is gone — resolve services directly from the container.
        const ctx: Record<string, any> = { container: this.container };
        for (const enhancer of this.container.resolveAll(GraphQLContextEnhancer)) {
            await enhancer.enhance(ctx);
        }
        for (const schema of this.container.resolveAll(GraphQLContextualSchema)) {
            await schema.build(ctx);
        }

        // Use the real Lambda context's countdown when the invocation has one; otherwise fall back
        // to a Date-based countdown so the timer still winds down instead of staying static.
        const lambdaContext = this.container.resolve(AwsLambdaContext);
        const timer = new LambdaTimer({
            getRemainingTimeInMillis: () => {
                if (lambdaContext.isSet()) {
                    return lambdaContext.get().getRemainingTimeInMillis();
                }
                return fallbackStartTime + FALLBACK_MAX_RUNNING_MILLISECONDS - Date.now();
            }
        });
        const runner = new TaskRunner(ctx as Context, timer, new TaskEventValidation());

        // Return the task result — the SFN reads `$.status` (continue/done/error) from it to drive
        // the state machine. Returning void makes the SFN see null → UnknownError → FAILED.
        return runner.run(taskEvent);
    }
}

export const BackgroundTaskLambdaHandler = BackgroundTaskEventHandler.createImplementation({
    implementation: BackgroundTaskLambdaHandlerImpl,
    dependencies: [RequestContainer]
});
