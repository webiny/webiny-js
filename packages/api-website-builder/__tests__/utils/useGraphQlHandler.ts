import { getIntrospectionQuery } from "graphql";
import { until } from "@webiny/project-utils/testing/helpers/until.js";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms/testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms/testing";
import { createContextPlugin } from "@webiny/api";
import { InvalidateCloudfrontCacheTaskDefinition } from "@webiny/api-file-manager-s3/features/FlushCache/InvalidateCacheTask.js";
import { createWebsiteBuilder } from "~/index.js";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import { PageModelPlugin } from "~/domain/page/page.model.js";
import { RedirectModelPlugin } from "~/domain/redirect/redirect.model.js";
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
            createContextPlugin(ctx => {
                ctx.container.register(InvalidateCloudfrontCacheTaskDefinition);
            }),
            createWebsiteBuilder(),
            ...[params.plugins].flat(Infinity as 1).filter(Boolean)
        ],
        features: container => {
            // Background tasks are DI-native — the feature registers the "wbyTask" model at
            // register() time (before WB/Languages cache the per-request model set). Mock override after.
            BackgroundTasksFeature.register(container);
            container.register(PageModelPlugin);
            container.register(RedirectModelPlugin);
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
