import { useContextHandler, type UseContextHandlerParams } from "@webiny/testing";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { createModelsPlugins, type ICreateModelsPluginsParams } from "../__cms/models.js";
import { CmsWorkflowsFeature } from "~/index.js";

export const createContextHandler = (
    params?: UseContextHandlerParams & ICreateModelsPluginsParams
) => {
    const testLicence = createTestWcpLicense();

    return useContextHandler({
        ...params,
        bottomPlugins: [...createModelsPlugins(params), params?.plugins || []],
        // CmsWorkflowsFeature registers WorkflowsFeature + the CMS entry-workflow wiring.
        features: container => CmsWorkflowsFeature.register(container),
        testProjectLicense: testLicence
    });
};
