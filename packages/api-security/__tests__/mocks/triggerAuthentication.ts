import { BeforeHandlerPlugin } from "@webiny/api";
import { SecurityContext } from "~/types";

export const triggerAuthentication = () => {
    return new BeforeHandlerPlugin<SecurityContext>(context => {
        context.security.authenticate("");
    });
};
