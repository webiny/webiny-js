import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/background-tasks/testing/index.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { Container } from "@webiny/di";
import { NoopInvalidateAssetCacheTaskDefinition } from "./noopInvalidateAssetCacheTask.js";
import { WebsiteBuilderFeature } from "~/index.js";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const DEFAULT_IDENTITY: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

type Params = Omit<CmsTestHandlerParams, "setup">;

export const useHandler = (params: Params = {}) => {
    const { getContext } = createCmsTestHandler({
        ...params,
        // identity === null → anonymous; the shared harness authenticates the null identity natively
        // (TestAuthenticator returns it), so no post-auth override is needed.
        //
        legacyPlugins: [
            (container: Container) => {
                container.register(NoopInvalidateAssetCacheTaskDefinition);
            },
            ...[params.legacyPlugins].flat(Infinity as 1).filter(Boolean)
        ],
        setup: container => {
            // All DI-native now: background tasks (wbyTask model + TasksCrud + GraphQL) and website
            // builder (models + features + schema). The mock TaskService override must come after.
            BackgroundTasksFeature.register(container);
            WebsiteBuilderFeature.register(container);
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
