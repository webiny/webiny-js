import { Plugin } from "@webiny/plugins";
import { AdminUsersContext, TokenStorageOperations } from "~/types";

interface Params {
    context: AdminUsersContext;
}
export abstract class TokenStorageOperationsProvider extends Plugin {
    public static readonly type = "sau.storageOperationsProvider.token";

    public abstract provide(params: Params): Promise<TokenStorageOperations>;
}
