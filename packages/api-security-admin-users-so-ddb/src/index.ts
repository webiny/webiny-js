import { ApiKeyStorageOperationsProviderDdb } from "~/operations/apiKey";
import { SystemStorageOperationsProviderDdb } from "~/operations/system";
import { GroupsStorageOperationsProviderDdb } from "~/operations/groups";
import { UserStorageOperationsProviderDdb } from "~/operations/users";

export default () => [
    new ApiKeyStorageOperationsProviderDdb(),
    new GroupsStorageOperationsProviderDdb(),
    new SystemStorageOperationsProviderDdb(),
    new UserStorageOperationsProviderDdb()
];
