import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms/testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms/testing";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { createContextPlugin } from "@webiny/api";
import { InvalidateCloudfrontCacheTaskDefinition } from "@webiny/api-file-manager-s3/features/FlushCache/InvalidateCacheTask.js";
import { createWebsiteBuilder } from "~/index.js";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import { PageModelPlugin } from "~/domain/page/page.model.js";
import { RedirectModelPlugin } from "~/domain/redirect/redirect.model.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const DEFAULT_IDENTITY: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

type Params = Omit<CmsTestHandlerParams, "features">;

export const useHandler = (params: Params = {}) => {
    const { getContext } = createCmsTestHandler({
        ...params,
        // identity === null → anonymous; the shared harness authenticates the null identity natively
        // (TestAuthenticator returns it), so no post-auth override is needed.
        //
        plugins: [
            createContextPlugin(ctx => {
                ctx.container.register(InvalidateCloudfrontCacheTaskDefinition);
            }),
            createWebsiteBuilder(),
            ...[params.plugins].flat(Infinity as 1).filter(Boolean)
        ],
        features: container => {
            // Background tasks are DI-native — the feature registers the "wbyTask" CMS model at
            // register() time (before WB/Languages cache the per-request model set) plus TasksCrud and
            // the GraphQL contextual schema. The mock TaskService override must come after.
            BackgroundTasksFeature.register(container);
            container.register(PageModelPlugin);
            container.register(RedirectModelPlugin);
            LanguagesExtension.register(container);
            container.registerInstance(TaskService, createMockTaskService());
        }
    });

    return {
        identity: params.identity === undefined ? DEFAULT_IDENTITY : params.identity,
        tenant: { id: "root" },
        elasticsearch: createTestOpenSearchClient(),
        handler: () => getContext<ApiCoreContext>()
    };
};
