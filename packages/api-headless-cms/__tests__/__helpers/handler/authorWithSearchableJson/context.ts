import { type CmsHandlerEvent, useHandler } from "~tests/testHelpers/useHandler.js";
import { createAuthorWithSearchableJson } from "~tests/__helpers/models/authorWithSearchableJson.js";
import { createDefaultGroup } from "~tests/__helpers/groups/defaultGroup.js";

export const createAuthorWithSearchableJsonContextHandler = () => {
    const path = "manage/en-US";
    const result = useHandler({
        path,
        plugins: [createDefaultGroup(), createAuthorWithSearchableJson()]
    });

    return {
        ...result,
        handler: async (payload?: Partial<CmsHandlerEvent>) => {
            return result.handler({
                path,
                headers: {
                    "x-webiny-cms-endpoint": "manage",
                    "x-webiny-cms-locale": "en-US",
                    "x-tenant": result.tenant.id,
                    ...payload?.headers
                },
                ...payload
            });
        }
    };
};
