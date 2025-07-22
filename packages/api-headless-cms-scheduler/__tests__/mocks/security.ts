import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createMockGetIdentity } from "~tests/mocks/getIdentity.js";

export const createMockSecurity = (
    input?: Partial<Pick<CmsContext["security"], "getIdentity">>
): Pick<CmsContext["security"], "getIdentity"> => {
    const getIdentity = createMockGetIdentity();
    return {
        // @ts-expect-error
        getIdentity,
        withoutAuthorization: (cb: () => Promise<any>) => {
            return cb();
        },
        ...input
    };
};
