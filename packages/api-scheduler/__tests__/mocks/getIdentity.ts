import type { CmsIdentity } from "@webiny/api-headless-cms/types";

export const createMockGetIdentity = (identity?: CmsIdentity) => {
    return (): CmsIdentity => {
        return {
            id: "mock-identity-id",
            type: "admin",
            displayName: "Mock Identity",
            ...identity
        };
    };
};
