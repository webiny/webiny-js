import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { TenancyContext } from "./types";
import { Tenancy } from "./Tenancy";
import graphqlPlugins from "./graphql";

export default () => [
    new ContextPlugin<TenancyContext>(async context => {
        const { headers = {} } = context.http.request;

        let tenantId = headers["X-Tenant"] || headers["x-tenant"];
        if (!tenantId) {
            tenantId = "root";
        }

        context.tenancy = new Tenancy({
            tenant: tenantId,
            plugins: context.plugins,
            version: context.WEBINY_VERSION
        });

        await context.tenancy.init();
    }),
    graphqlPlugins
];
