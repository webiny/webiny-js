import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { WorkflowsFeature } from "~/WorkflowsFeature.js";

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
    const context = await handler.getContext();

    return {
        handler,
        context
    };
};
