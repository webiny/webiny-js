import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { AuthenticationContext } from "~/types";
import { createAuthentication } from "~/createAuthentication";

export default () => {
    return new ContextPlugin<AuthenticationContext>(context => {
        context.authentication = createAuthentication();
    });
};
