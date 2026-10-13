import type { Container } from "@webiny/di";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/background-tasks/testing/index.js";
import { WebsiteBuilderFeature } from "@webiny/api-website-builder";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "@webiny/api-headless-cms-workflows";
import { WebsiteBuilderWorkflowsFeature } from "~/index.js";
import { NoopInvalidateAssetCacheTaskDefinition } from "./NoopInvalidateAssetCacheTask.js";
import { createArticleModelPlugins } from "./cmsModel.js";

/**
 * Website Builder as in `api-website-builder`'s `useHandler`, plus the workflows features in the
 * production order (`registerApiRequestStack.ts`): WB workflows next to WB, then the engine and
 * the CMS workflows package, whose single handlers cover pages (R51). ACO is not registered, so a
 * no-op FLP stands in; tests replace it with the fake one through `legacyPlugins`. One public CMS
 * model ("article") exists for cross-app tests.
 */
export const createContextHandler = (params: CmsTestHandlerParams = {}) => {
    const { getContext, invoke } = createCmsTestHandler({
        ...params,
        legacyPlugins: [
            ...createArticleModelPlugins(),
            (container: Container) => {
                container.register(NoopInvalidateAssetCacheTaskDefinition);
                container.register(NoopFolderLevelPermissions);
            },
            ...[params.legacyPlugins].flat(Infinity as 1).filter(Boolean)
        ],
        setup: container => {
            BackgroundTasksFeature.register(container);
            WebsiteBuilderFeature.register(container);
            WebsiteBuilderWorkflowsFeature.register(container);
            LanguagesExtension.register(container);
            container.registerInstance(TaskService, createMockTaskService());
            WorkflowsFeature.register(container);
            CmsWorkflowsFeature.register(container);
        }
    });

    return {
        context: () => getContext(),
        /** POST to `/graphql` as the handler's identity. */
        invoke
    };
};
