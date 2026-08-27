import {
    HttpRoute,
    RequestContainer,
    runRequestContextInitializers
} from "@webiny/event-handler-core";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/api-graphql";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import { TaskRunner } from "@webiny/background-tasks/api/runner/index.js";
import { TaskEventValidation } from "@webiny/background-tasks/api/runner/TaskEventValidation.js";
import type { Context } from "@webiny/background-tasks/api/types.js";
import type { Container } from "@webiny/feature/api";
import { ProcessTimer } from "~/timer/ProcessTimer.js";
import { InternalToken } from "~/domain/InternalToken.js";

/* Shared between worker and route to gate access. */
const INTERNAL_HEADER = "x-webiny-background-task-token";

class BackgroundTaskRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    public readonly path = "/background-task";

    public constructor(
        private readonly container: Container,
        private readonly internalToken: InternalToken.Interface
    ) {}

    public async handle(request: HttpRoute.Request, response: HttpRoute.Response) {
        /* Reject requests without a matching internal token. */
        if (request.headers[INTERNAL_HEADER] !== this.internalToken.value) {
            return response.status(403).json({ error: "Forbidden." });
        }

        const taskEvent = request.body;

        if (!taskEvent || !taskEvent.webinyTaskId) {
            return response.status(400).json({ error: "Missing webinyTaskId in request body." });
        }

        try {
            if (taskEvent.tenant) {
                this.container.resolve(RawTenantId).set(taskEvent.tenant);
                await this.container.resolve(RequestTenantLoader).establish();
            }

            await runRequestContextInitializers(this.container, { continueOnError: true });

            /* TODO: remove once legacy ctx is gone — resolve services directly from the container. */
            const ctx: Record<string, any> = { container: this.container };
            for (const enhancer of this.container.resolveAll(GraphQLContextEnhancer)) {
                await enhancer.enhance(ctx);
            }
            for (const schema of this.container.resolveAll(GraphQLContextualSchema)) {
                await schema.build(ctx);
            }

            const timer = new ProcessTimer();
            const runner = new TaskRunner(ctx as Context, timer, new TaskEventValidation());
            const result = await runner.run(taskEvent);

            return response.json(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`Background task route error: ${message}`);
            return response.status(500).json({ status: "error", error: { message } });
        }
    }
}

export const BackgroundTaskRoute = HttpRoute.createImplementation({
    implementation: BackgroundTaskRouteImpl,
    dependencies: [RequestContainer, InternalToken]
});
