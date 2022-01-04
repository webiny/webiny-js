import { ContextPlugin } from "@webiny/handler";
import { AuthenticationContext } from "~/types";
import { createAuthentication } from "~/createAuthentication";

export default () => {
    return new ContextPlugin<AuthenticationContext>(context => {
        context.authentication = createAuthentication();
    });
};
