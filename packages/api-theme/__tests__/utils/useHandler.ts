import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ThemeFeature } from "~/index.js";

const DEFAULT_IDENTITY: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

type Params = Omit<CmsTestHandlerParams, "setup">;

export const useHandler = (params: Params = {}) => {
    const { getContext } = createCmsTestHandler({
        ...params,
        setup: container => {
            ThemeFeature.register(container);
        }
    });

    return {
        identity: params.identity === undefined ? DEFAULT_IDENTITY : params.identity,
        tenant: { id: "root" },
        handler: () => getContext<ApiCoreContext>()
    };
};
