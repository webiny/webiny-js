import { Context as BaseContext } from "@webiny/handler/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { BeforeHandlerPlugin } from "@webiny/handler/plugins/BeforeHandlerPlugin";
import { AuthenticationContext } from "~/types";
import { Authentication } from "~/Authentication";
import { AuthenticationPlugin } from "~/plugins/AuthenticationPlugin";
import { Identity } from "~/Identity";

interface Context extends BaseContext, AuthenticationContext {}

export default () => [
    new ContextPlugin<Context>(context => {
        context.authentication = new Authentication();
    }),
    new BeforeHandlerPlugin<Context>(async context => {
        const authenticationPlugins = context.plugins.byType<AuthenticationPlugin>(
            AuthenticationPlugin.type
        );

        for (let i = 0; i < authenticationPlugins.length; i++) {
            const identity = await authenticationPlugins[i].authenticate(context);
            if (identity instanceof Identity) {
                context.authentication.setIdentity(identity);
                return;
            }
        }
    })
];
