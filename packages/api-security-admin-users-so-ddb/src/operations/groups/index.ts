import { GroupsStorageOperationsProvider } from "@webiny/api-security-admin-users/plugins/GroupsStorageOperationsProvider";
import { GroupsStorageOperationsDdb } from "./GroupsStorageOperations";
import fields from "./fields";

export class GroupsStorageOperationsProviderDdb extends GroupsStorageOperationsProvider {
    public name = "sau.storageOperationsProvider.groups.ddb";

    public async provide({ context }): Promise<GroupsStorageOperationsDdb> {
        context.plugins.register(fields());

        return new GroupsStorageOperationsDdb({
            context
        });
    }
}
