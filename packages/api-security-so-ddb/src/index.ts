import { SecurityPlugin } from "@webiny/api-security/plugins/SecurityPlugin";
import { GroupsStorageOperationsDdb } from "~/operations/GroupsStorageOperations";
import { SecurityStorageParams } from "~/types";
import { SystemStorageOperationsDdb } from "~/operations/SystemStorageOperations";
import { IdentityStorageDdb } from "~/operations/IdentityStorageOperations";
import { ApiKeyStorageOperationsDdb } from "~/operations/ApiKeyStorageOperations";

export default (params: SecurityStorageParams) => {
    return new SecurityPlugin(app => {
        app.identity.setStorageOperations(
            factoryParams => new IdentityStorageDdb({ ...params, ...factoryParams })
        );

        app.groups.setStorageOperations(
            factoryParams => new GroupsStorageOperationsDdb({ ...params, ...factoryParams })
        );

        app.system.setStorageOperations(
            factoryParams => new SystemStorageOperationsDdb({ ...params, ...factoryParams })
        );

        app.apiKeys.setStorageOperations(
            factoryParams => new ApiKeyStorageOperationsDdb({ ...params, ...factoryParams })
        );
    });
};
