import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/background-tasks/testing/index.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { WebsiteBuilderFeature } from "~/index.js";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Container } from "@webiny/di";
import { AcoFeature } from "@webiny/api-aco";
import { Result } from "@webiny/feature/api";
import { InlineTaskServiceFeature } from "@webiny/api-core-testing";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-core/features/websockets/index.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";

const DEFAULT_IDENTITY: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

type Params = Omit<CmsTestHandlerParams, "setup"> & {
    /**
     * Register ACO (folders, folder level permissions). Off by default.
     */
    aco?: boolean;
};

const createAcoPlugins = () => {
    // ACO owns folders. Its folder handlers also need a task service and a websocket sender.
    const acoStorage = getStorageOps("aco");
    const registerAco = (container: Container) => {
        AcoFeature.register(container);
        container.registerInstance(WebsocketsSendToIdentityUseCase, {
            execute: async () => Result.ok()
        });
        InlineTaskServiceFeature.register(container);
    };
    return [...acoStorage.plugins, registerAco];
};

export const useHandler = ({ aco = false, ...params }: Params = {}) => {
    const { getContext } = createCmsTestHandler({
        ...params,
        legacyPlugins: [
            ...[params.legacyPlugins].flat(Infinity as 1).filter(Boolean),
            ...(aco ? createAcoPlugins() : [])
        ],
        // identity === null → anonymous; the shared harness authenticates the null identity natively
        // (TestAuthenticator returns it), so no post-auth override is needed.
        setup: container => {
            // All DI-native now: background tasks (wbyTask model + task use cases + GraphQL) and website
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
