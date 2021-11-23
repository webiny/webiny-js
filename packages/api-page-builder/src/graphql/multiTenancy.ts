import { TenancyContext, Tenant } from "@webiny/api-tenancy/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { Args as PsRenderArgs } from "@webiny/api-prerendering-service/render/types";
import { PbContext } from "~/types";

export interface Context extends TenancyContext, PbContext {}

function updateStorageFolder(item: PsRenderArgs, tenant: Tenant) {
    if (item.path === "/") {
        item.configuration.storage.folder = tenant.id;
        return;
    }

    item.configuration.storage.folder = `${tenant.id}/${item.path}`;
}

export default () => {
    return new ContextPlugin<Context>(context => {
        if (!context.tenancy.isMultiTenant()) {
            return;
        }

        context.pageBuilder.onPageBeforeRender.subscribe(({ args }) => {
            if (args.render) {
                const tenant = context.tenancy.getCurrentTenant();
                for (const item of args.render) {
                    updateStorageFolder(item, tenant);
                }
            }
        });
    });
};
