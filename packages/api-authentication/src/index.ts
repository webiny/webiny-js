import { ContextPlugin } from "@webiny/api";
import { AuthenticationContext } from "~/types";
import { createAuthentication } from "~/createAuthentication";

export default () => {
    return new ContextPlugin<AuthenticationContext>(context => {
        context.authentication = createAuthentication();
    });
};
