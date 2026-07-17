import { getIntrospectionQuery } from "graphql";
import { until } from "@webiny/project-utils/testing/helpers/until.js";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { Container } from "@webiny/di";
import { NoopCloudfrontInvalidateCacheTaskDefinition } from "./noopCloudfrontInvalidateCacheTask.js";
import { WebsiteBuilderFeature } from "~/index.js";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import { createWbSdk } from "~tests/utils/createWbSdk.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";

export interface UseGQLHandlerParams extends Omit<CmsTestHandlerParams, "features"> {
    identity?: IdentityData | null;
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { handler, invoke } = createCmsTestHandler({
        ...params,
        // identity === null → anonymous (handled natively by the shared harness).
        plugins: [
            (container: Container) => {
                container.register(NoopCloudfrontInvalidateCacheTaskDefinition);
            },
            ...[params.plugins].flat(Infinity as 1).filter(Boolean)
        ],
        features: container => {
            // All DI-native now: background tasks (wbyTask model + TasksCrud + GraphQL) and website
            // builder (models + features + schema). The mock TaskService override must come after.
            BackgroundTasksFeature.register(container);
            WebsiteBuilderFeature.register(container);
            LanguagesExtension.register(container);
            container.registerInstance(TaskService, createMockTaskService());
        }
    });

    const wb = createWbSdk(invoke as any);

    return {
        until,
        params,
        handler,
        invoke,
        wb,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        }
    };
};
