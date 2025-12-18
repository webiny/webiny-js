import { createWorkflows } from "@webiny/api-workflows";
import { useContextHandler, type UseContextHandlerParams } from "@webiny/testing";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { createModelsPlugins } from "../__cms/models.js";
import { createHeadlessCmsWorkflows } from "~/index.js";

export const createContextHandler = (params?: UseContextHandlerParams) => {
    const testLicence = createTestWcpLicense();

    return useContextHandler({
        ...params,
        bottomPlugins: [
            ...createModelsPlugins(),
            createWorkflows(),
            createHeadlessCmsWorkflows(),
            params?.plugins || []
        ],
        testProjectLicense: testLicence
    });
};
