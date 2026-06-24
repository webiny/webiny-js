import { WorkflowsFeature } from "@webiny/api-workflows";
import { useContextHandler, type UseContextHandlerParams } from "@webiny/testing";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { createModelsPlugins, type ICreateModelsPluginsParams } from "../__cms/models.js";
import { createHeadlessCmsWorkflows } from "~/index.js";

export const createContextHandler = (
    params?: UseContextHandlerParams & ICreateModelsPluginsParams
) => {
    const testLicence = createTestWcpLicense();

    return useContextHandler({
        ...params,
        bottomPlugins: [
            ...createModelsPlugins(params),
            createHeadlessCmsWorkflows(),
            params?.plugins || []
        ],
        features: container => WorkflowsFeature.register(container),
        testProjectLicense: testLicence
    });
};
