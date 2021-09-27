import { UserStorageOperationsProvider } from "@webiny/api-security-admin-users/plugins/UserStorageOperationsProvider";
import { UserStorageOperationsDdb } from "./UserStorageOperations";
import { UserStorageOperations } from "@webiny/api-security-admin-users/types";
import fields from "./fields";

export class UserStorageOperationsProviderDdb extends UserStorageOperationsProvider {
    public name = "sau.storageOperationsProvider.user.ddb";

    public async provide({ context }): Promise<UserStorageOperations> {
        context.plugins.register(fields());

        return new UserStorageOperationsDdb({
            context
        });
    }
}
