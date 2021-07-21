import { TokenStorageOperationsProvider } from "@webiny/api-security-admin-users/plugins/TokenStorageOperationsProvider";
import { TokenStorageOperationsDdb } from "./TokenStorageOperations";

export class TokenStorageOperationsProviderDdb extends TokenStorageOperationsProvider {
    public name = "sau.storageOperationsProvider.system.ddb";

    public async provide({ context }): Promise<TokenStorageOperationsDdb> {
        return new TokenStorageOperationsDdb({
            context
        });
    }
}
