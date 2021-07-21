import {
    AdminUsersContext,
    TokenStorageOperations,
    TokenStorageOperationsCreateParams,
    UserPersonalAccessToken
} from "@webiny/api-security-admin-users/types";
import WebinyError from "@webiny/error";
import { createTokenEntity } from "~/definitions/tokenEntity";
import { Entity, Table } from "dynamodb-toolbox";
import { createTable } from "~/definitions/table";

interface Params {
    context: AdminUsersContext;
}

export class TokenStorageOperationsDdb implements TokenStorageOperations {
    private readonly context: AdminUsersContext;
    private readonly table: Table;
    private readonly tokenEntity: Entity<any>;

    public constructor(params: Params) {
        const { context } = params;
        this.table = createTable({
            context
        });

        this.tokenEntity = createTokenEntity({
            context,
            table: this.table
        });
    }

    public async createToken(
        params: TokenStorageOperationsCreateParams
    ): Promise<UserPersonalAccessToken> {
        const { identity, token } = params;
        const keys = {
            PK: `U#${identity.id}`,
            SK: `PAT#${token.id}`,
            GSI1_PK: `PAT`,
            GSI1_SK: token.token
        };
        try {
            await this.tokenEntity.put({
                ...token,
                ...keys,
                TYPE: "security.pat"
            });
            return token;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot create user access token.",
                ex.code || "CREATE_USER_ACCESS_TOKEN_ERROR",
                {
                    keys,
                    token
                }
            );
        }
    }
}
