import { BeforeHandlerPlugin } from "@webiny/handler";
import type { ApiCoreContext } from "~/types/core.js";

export const triggerAuthentication = () => {
    return new BeforeHandlerPlugin<ApiCoreContext>(context => {
        context.security.authenticate("");
    });
};
