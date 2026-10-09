import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { createModelsPlugins, type ICreateModelsPluginsParams } from "../__cms/models.js";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "~/index.js";

const registerNoopFlp = createRegisterExtensionPlugin(context => {
    context.container.register(NoopFolderLevelPermissions);
});

export const createContextHandler = (
    params?: CmsTestHandlerParams & ICreateModelsPluginsParams
) => {
    const testLicence = createTestWcpLicense();

    const { getContext } = createCmsTestHandler({
        ...params,
        legacyPlugins: [
            ...createModelsPlugins(params),
            registerNoopFlp,
            params?.legacyPlugins || []
        ],
        // Mirror the production stack (registerApiRequestStack.ts): core workflows first, then the
        // CMS integration.
        setup: container => {
            WorkflowsFeature.register(container);
            CmsWorkflowsFeature.register(container);
        },
        testProjectLicense: testLicence
    });

    return {
        identity: { id: "id-12345678", type: "admin", displayName: "John Doe" },
        tenant: { id: "root" },
        opensearch: createTestOpenSearchClient(),
        context: () => getContext()
    };
};
