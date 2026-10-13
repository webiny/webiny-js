import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { createModelsPlugins, type ICreateModelsPluginsParams } from "../__cms/models.js";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "~/index.js";
import { registerFakeFolders } from "../__helpers/FakeFolders.js";

const registerNoopFlp = createRegisterExtensionPlugin(context => {
    context.container.register(NoopFolderLevelPermissions);
});

export const createContextHandler = (
    params?: CmsTestHandlerParams & ICreateModelsPluginsParams
) => {
    const testLicence = createTestWcpLicense();

    const handler = createCmsTestHandler({
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
            // ACO is not registered; the CMS folder port reads these stand-ins.
            registerFakeFolders(container);
        },
        testProjectLicense: params?.testProjectLicense ?? testLicence
    });

    return {
        identity: { id: "id-12345678", type: "admin", displayName: "John Doe" },
        tenant: { id: "root" },
        opensearch: createTestOpenSearchClient(),
        handler,
        /** `getContext()` is `Record<string, any>` unless typed; the tests read the CMS context. */
        context: () => handler.getContext<CmsContext>(),
        /** The main `/graphql` endpoint (the `cms` root lives there). */
        invoke: handler.invoke,
        /** The CMS endpoints (`/cms/manage` by default). */
        invokeCms: handler.invokeCms,
        createQuery: handler.createQuery,
        createMutation: handler.createMutation,
        introspect: handler.introspect
    };
};
