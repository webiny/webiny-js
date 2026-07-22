import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
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
import { GetRootTenantUseCase } from "@webiny/api-core/features/tenancy/GetRootTenant/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import type { Container } from "@webiny/feature/api";
import { SchedulerInternalToken } from "./abstractions/InternalToken.js";
import { SchedulerSingleton } from "./abstractions/SchedulerSingleton.js";

const INTERNAL_HEADER = "x-webiny-scheduler-token";

/**
 * Re-arms the persisted (pending) scheduled actions for a tenant into the root Bree singleton — used
 * at boot to restore schedules after a restart. Runs the full request-context bootstrap (like the run
 * route) so ListScheduledActionsUseCase has its CMS model, then hands the results to the singleton's
 * `recover()`. Defaults to the root tenant when no tenant is given.
 *
 * NOTE: recovers ONE tenant per call. Boot recovery for additional (non-root) tenants would enumerate
 * tenants and call this per tenant — left as a follow-up; single/root-tenant deployments are covered.
 */
class ScheduledActionRecoverRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    public readonly path = "/scheduled-action-recover";

    public constructor(
        private readonly container: Container,
        private readonly internalToken: SchedulerInternalToken.Interface
    ) {}

    public async handle(request: IHttpRequest): Promise<IHttpResponse> {
        if (request.headers[INTERNAL_HEADER] !== this.internalToken.value) {
            return { statusCode: 403, body: { error: "Forbidden." } };
        }

        try {
            let tenant: string | undefined = request.body?.tenant;
            if (!tenant) {
                const rootResult = await this.container.resolve(GetRootTenantUseCase).execute();
                if (rootResult.isFail()) {
                    return { statusCode: 200, body: { status: "ok", recovered: 0 } };
                }
                tenant = rootResult.value.id;
            }

            this.container.resolve(RawTenantId).set(tenant);
            await this.container.resolve(RequestTenantLoader).establish();

            await runRequestContextInitializers(this.container, { continueOnError: true });

            const ctx: Record<string, any> = { container: this.container };
            for (const enhancer of this.container.resolveAll(GraphQLContextEnhancer)) {
                await enhancer.enhance(ctx);
            }
            for (const schema of this.container.resolveAll(GraphQLContextualSchema)) {
                await schema.build(ctx);
            }

            // At boot there's no request and no identity, so we skip authorization for the list — the
            // same thing ExecuteScheduledActionUseCase does on the run route. Without it, the
            // permission check in ListScheduledActions sees the anonymous identity and fails with
            // "Not authorized!".
            const listResult = await this.container
                .resolve(IdentityContext)
                .withoutAuthorization(() =>
                    this.container
                        .resolve(ListScheduledActionsUseCase)
                        .execute({ where: {}, limit: 1000 })
                );

            if (listResult.isFail()) {
                return {
                    statusCode: 500,
                    body: { status: "error", error: { message: listResult.error.message } }
                };
            }

            const pending = listResult.value.items.map(action => ({
                id: action.id,
                namespace: action.namespace,
                tenant: tenant as string,
                scheduledFor: action.scheduledFor
            }));

            await this.container.resolve(SchedulerSingleton).recover(pending);

            return {
                statusCode: 200,
                headers: { "content-type": "application/json" },
                body: { status: "ok", recovered: pending.length }
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`Scheduled action recover route error: ${message}`);
            return { statusCode: 500, body: { status: "error", error: { message } } };
        }
    }
}

export const ScheduledActionRecoverRoute = HttpRoute.createImplementation({
    implementation: ScheduledActionRecoverRouteImpl,
    dependencies: [RequestContainer, SchedulerInternalToken]
});
