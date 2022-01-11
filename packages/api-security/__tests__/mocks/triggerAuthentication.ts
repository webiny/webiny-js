import { BeforeHandlerPlugin } from "@webiny/handler";
import { SecurityContext } from "~/types";

export const triggerAuthentication = () => {
    return new BeforeHandlerPlugin<SecurityContext>(context => {
        context.security.authenticate("");
    });
};
