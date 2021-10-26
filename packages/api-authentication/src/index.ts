import { Context as BaseContext } from "@webiny/handler/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { AuthenticationContext } from "~/types";
import { createAuthentication } from "~/createAuthentication";

interface Context extends BaseContext, AuthenticationContext {}

export default () => {
    return new ContextPlugin<Context>(context => {
        context.authentication = createAuthentication();
    });
};
