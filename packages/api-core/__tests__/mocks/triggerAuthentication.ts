import { ContextPlugin } from "@webiny/api";

import type { ApiCoreContext } from "~/types/core.js";

export const triggerAuthentication = () => {
    return new ContextPlugin<ApiCoreContext>(async context => {
        await context.security.authenticate("");
    });
};
