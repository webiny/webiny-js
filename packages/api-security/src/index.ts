import { PluginCollection } from "@webiny/plugins/types";
import { BeforeHandlerPlugin } from "@webiny/handler/plugins/BeforeHandlerPlugin";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { Identity } from "@webiny/api-authentication/Identity";
export { default as NotAuthorizedResponse } from "./NotAuthorizedResponse";
export { default as NotAuthorizedError } from "./NotAuthorizedError";
import { AuthenticationPlugin } from "./plugins/AuthenticationPlugin";
import { Security } from "./Security";
import { SecurityContext } from "./types";
import { SecurityPlugin } from "./plugins/SecurityPlugin";
import { GroupsInstaller } from "./installation/groups";

export default (): PluginCollection => [
    new BeforeHandlerPlugin<SecurityContext>(async context => {
        const authenticationPlugins = context.plugins.byType<AuthenticationPlugin>(
            AuthenticationPlugin.type
        );

        for (let i = 0; i < authenticationPlugins.length; i++) {
            const identity = await authenticationPlugins[i].authenticate(context);
            if (identity instanceof Identity) {
                context.security.setIdentity(identity);
                return;
            }
        }
    }),
    new ContextPlugin<SecurityContext & TenancyContext>(async context => {
        const security = new Security({
            tenant: context.tenancy.getCurrentTenant().id,
            plugins: context.plugins,
            version: context.WEBINY_VERSION
        });

        await security.init();

        context.security = security;
    }),
    new SecurityPlugin(app => {
        app.system.addInstaller(new GroupsInstaller());
    })
];
