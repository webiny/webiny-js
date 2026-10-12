import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { Container } from "@webiny/feature/api";
import { WorkflowsFeature } from "~/WorkflowsFeature.js";

/** The part of the request context the tests read. `getContext()` is otherwise `Record<string, any>`. */
export interface WorkflowsTestContext {
    container: Container;
}

/**
 * Request context with `WorkflowsFeature` registered. `params.setup` runs after it, so tests can
 * register fakes and decorators on top of the workflows abstractions.
 */
export const createContextHandler = async (params: CmsTestHandlerParams = {}) => {
    const handler = createCmsTestHandler({
        ...params,
        setup: async container => {
            WorkflowsFeature.register(container);
            await params.setup?.(container);
        },
        permissions: params.permissions ?? [{ name: "*" }]
    });
    const context = await handler.getContext<WorkflowsTestContext>();

    return {
        handler,
        context
    };
};
