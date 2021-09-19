import { TenancyPlugin } from "@webiny/api-tenancy/plugins/TenancyPlugin";
import { SystemStorageOperationsDdb } from "~/operations/SystemStorageOperations";
import { TenancyStorageParams } from "~/types";
import { TenantsStorageOperationsDdb } from "~/operations/TenancyStorageOperations";

export default (params: Pick<TenancyStorageParams, "table" | "documentClient">) => {
    return new TenancyPlugin(app => {
        app.tenants.setStorageOperations(
            factoryParams => new TenantsStorageOperationsDdb({ ...params, ...factoryParams })
        );

        app.system.setStorageOperations(
            factoryParams => new SystemStorageOperationsDdb({ ...params, ...factoryParams })
        );
    });
};
