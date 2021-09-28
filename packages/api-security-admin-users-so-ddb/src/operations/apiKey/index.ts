import { AdminUsersContext } from "@webiny/api-security-admin-users/types";
import { ApiKeyStorageOperationsDdb } from "./ApiKeyStorageOperations";
import { ApiKeyStorageOperationsProvider } from "@webiny/api-security-admin-users/plugins/ApiKeyStorageOperationsProvider";
import fields from "./fields";

interface Params {
    context: AdminUsersContext;
}
export class ApiKeyStorageOperationsProviderDdb extends ApiKeyStorageOperationsProvider {
    public name = "sau.storageOperationsProvider.apiKey.ddb";
    async provide({ context }: Params) {
        context.plugins.register(fields());

        return new ApiKeyStorageOperationsDdb({
            context
        });
    }
}
