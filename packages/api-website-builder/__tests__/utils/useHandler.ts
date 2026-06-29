import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import {
    createBackgroundTaskContext,
    createBackgroundTaskGraphQL
} from "@webiny/background-tasks/api";
import { createMockTaskServicePlugin } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
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
        // Background-task plugins must come BEFORE the Website Builder plugins: createBackgroundTaskContext
        // registers the "wbyTask" CMS model, and it has to be present before WB/Languages init lists +
        // caches the per-request model set (otherwise createBackgroundTaskGraphQL can't find it).
        plugins: [
            createBackgroundTaskContext(),
            ...createBackgroundTaskGraphQL(),
            createMockTaskServicePlugin(),
            createContextPlugin(ctx => {
                ctx.container.register(InvalidateCloudfrontCacheTaskDefinition);
            }),
            createWebsiteBuilder(),
            ...[params.plugins].flat(Infinity as 1).filter(Boolean)
        ],
        features: container => {
            container.register(PageModelPlugin);
            container.register(RedirectModelPlugin);
            LanguagesExtension.register(container);
        }
    });

    return {
        identity: params.identity === undefined ? DEFAULT_IDENTITY : params.identity,
        tenant: { id: "root" },
        elasticsearch: createTestOpenSearchClient(),
        handler: () => getContext<ApiCoreContext>()
    };
};
