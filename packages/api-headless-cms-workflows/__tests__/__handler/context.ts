import { createWorkflows } from "@webiny/api-workflows";
import { useContextHandler, type UseContextHandlerParams } from "@webiny/testing";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { createModelsPlugins, type ICreateModelsPluginsParams } from "../__cms/models.js";
import { createHeadlessCmsWorkflows } from "~/index.js";

const registerNoopFlp = createRegisterExtensionPlugin(context => {
    context.container.register(NoopFolderLevelPermissions);
});

export const createContextHandler = (
    params?: UseContextHandlerParams & ICreateModelsPluginsParams
) => {
    const testLicence = createTestWcpLicense();

    return useContextHandler({
        ...params,
        bottomPlugins: [
            ...createModelsPlugins(params),
            registerNoopFlp,
            createWorkflows(),
            createHeadlessCmsWorkflows(),
            params?.plugins || []
        ],
        testProjectLicense: testLicence
    });
};
