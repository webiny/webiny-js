import type { Container } from "@webiny/feature/api";
import { BackgroundTaskEventHandler } from "@webiny/event-handler-core";
import { RequestContainer } from "@webiny/event-handler-core";
import type { EventContext } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { RawTenantId } from "@webiny/api-core/features/requestContext/index.js";
import { RequestTenantLoader } from "@webiny/api-core/features/requestContext/index.js";
import { TaskRunner } from "@webiny/background-tasks/api/runner/index.js";
import { TaskEventValidation } from "@webiny/background-tasks/api/runner/TaskEventValidation.js";
import type { Context } from "@webiny/background-tasks/api/types.js";
import { ProcessTimer } from "~/timer/ProcessTimer.js";

/**
 * Runs one iteration of a background task in the request container the dispatcher built for it.
 * The standalone counterpart of `BackgroundTaskLambdaHandler`: same tenant set-up and runner, with
 * a process timer in place of the Lambda countdown.
 */
class InProcessBackgroundTaskHandlerImpl implements BackgroundTaskEventHandler.Interface {
    public constructor(
        private readonly container: Container,
        private readonly rawTenantId: RawTenantId.Interface,
        private readonly tenantLoader: RequestTenantLoader.Interface
    ) {}

    public async execute(eventCtx: EventContext<IBackgroundTaskEvent>): Promise<unknown> {
        const taskEvent = eventCtx.event;

        this.rawTenantId.set(taskEvent.tenant);
        await this.tenantLoader.establish();

        // TaskRunner still takes the legacy context object, which now only carries the container.
        const ctx: Record<string, any> = { container: this.container };

        const timer = new ProcessTimer();
        const runner = new TaskRunner(ctx as Context, timer, new TaskEventValidation());

        // The loop reads `status`, `wait` and `delay` from this to decide what happens next.
        return runner.run(taskEvent);
    }
}

export const InProcessBackgroundTaskHandler = BackgroundTaskEventHandler.createImplementation({
    implementation: InProcessBackgroundTaskHandlerImpl,
    dependencies: [RequestContainer, RawTenantId, RequestTenantLoader]
});
