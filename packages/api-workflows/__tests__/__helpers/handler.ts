import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { Container } from "@webiny/feature/api";
import { WorkflowsFeature } from "~/WorkflowsFeature.js";
import { FakeTaskService } from "./FakeTaskService.js";

/** The part of the request context the tests read. `getContext()` is otherwise `Record<string, any>`. */
export interface WorkflowsTestContext {
    container: Container;
}

/**
 * Request context with `WorkflowsFeature` registered. `params.setup` runs after it, so tests can
 * register fakes and decorators on top of the workflows abstractions. The same handler also serves
 * GraphQL on `/graphql`: `invoke`, `createQuery`, `createMutation` and `introspect`.
 */
export const createContextHandler = async (params: CmsTestHandlerParams = {}) => {
    const handler = createCmsTestHandler({
        ...params,
        setup: async container => {
            WorkflowsFeature.register(container);
            // `ReviewSaver` aborts tasks through `TaskService`; the test containers have no
            // background-tasks feature. A test that needs another one registers it in `setup`.
            container.register(FakeTaskService);
            await params.setup?.(container);
        },
        permissions: params.permissions ?? [{ name: "*" }]
    });
    const context = await handler.getContext<WorkflowsTestContext>();

    return {
        handler,
        context,
        invoke: handler.invoke,
        createQuery: handler.createQuery,
        createMutation: handler.createMutation,
        introspect: handler.introspect
    };
};
