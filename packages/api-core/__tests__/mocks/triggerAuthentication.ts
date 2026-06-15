import { ContextPlugin } from "@webiny/api";

import type { ApiCoreContext } from "~/types/core.js";

export const triggerAuthentication = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        if (!context.request.headers.authorization) {
            if (!context.security.getIdentity()) {
                context.security.authenticate("");
            }
        }
    });
};
