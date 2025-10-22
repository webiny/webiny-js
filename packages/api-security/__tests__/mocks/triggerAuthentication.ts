import { BeforeHandlerPlugin } from "@webiny/handler";
import type { SecurityContext } from "~/types";

export const triggerAuthentication = () => {
    return new BeforeHandlerPlugin<SecurityContext>(context => {
        if (!context.request.headers.authorization) {
            context.security.authenticate("");
        }
    });
};
