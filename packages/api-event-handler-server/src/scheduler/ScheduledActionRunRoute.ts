import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import {
    HttpRoute,
    RequestContainer,
    runRequestContextInitializers
} from "@webiny/event-handler-core";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/handler-graphql";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";
import type { Container } from "@webiny/feature/api";
import { SchedulerInternalToken } from "./InternalToken.js";

/* Shared between the Bree singleton and this route to gate access. */
const INTERNAL_HEADER = "x-webiny-scheduler-token";

/**
 * Runs a single scheduled action. The in-process Bree singleton (root) POSTs here when a timer fires —
 * the timer fires OUTSIDE any HTTP request, so this route rebuilds the full request context (tenant +
 * CMS models via the request-context initializers + contextual schemas) for the action's tenant, then
 * runs ExecuteScheduledActionUseCase. Mirrors the background-task run route.
 */
class ScheduledActionRunRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    public readonly path = "/scheduled-action-run";

    public constructor(
        private readonly container: Container,
        private readonly internalToken: SchedulerInternalToken.Interface
    ) {}

    public async handle(request: IHttpRequest): Promise<IHttpResponse> {
        if (request.headers[INTERNAL_HEADER] !== this.internalToken.value) {
            return { statusCode: 403, body: { error: "Forbidden." } };
        }

        const { id, namespace, tenant } = request.body ?? {};
        if (!id || !namespace || !tenant) {
            return { statusCode: 400, body: { error: "Missing id, namespace or tenant." } };
        }

        try {
            this.container.resolve(RawTenantId).set(tenant);
            await this.container.resolve(RequestTenantLoader).establish();

            await runRequestContextInitializers(this.container, { continueOnError: true });

            /* TODO: remove once legacy ctx is gone — resolve services directly from the container. */
            const ctx: Record<string, any> = { container: this.container };
            for (const enhancer of this.container.resolveAll(GraphQLContextEnhancer)) {
                await enhancer.enhance(ctx);
            }
            for (const schema of this.container.resolveAll(GraphQLContextualSchema)) {
                await schema.build(ctx);
            }

            const result = await this.container
                .resolve(ExecuteScheduledActionUseCase)
                .execute({ id, namespace, tenant });

            if (result.isFail()) {
                return {
                    statusCode: 500,
                    body: { status: "error", error: { message: result.error.message } }
                };
            }

            return {
                statusCode: 200,
                headers: { "content-type": "application/json" },
                body: { status: "ok" }
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`Scheduled action run route error: ${message}`);
            return { statusCode: 500, body: { status: "error", error: { message } } };
        }
    }
}

export const ScheduledActionRunRoute = HttpRoute.createImplementation({
    implementation: ScheduledActionRunRouteImpl,
    dependencies: [RequestContainer, SchedulerInternalToken]
});
