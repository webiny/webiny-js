import WebinyError from "@webiny/error";
import { GetCredentialByUserIdStorageOperation } from "@webiny/self-hosted-auth";
import { toCredential } from "./CredentialsTable.js";
import { CredentialsTable } from "./CredentialsTable.js";

class SqlGetCredentialByUserIdImpl implements GetCredentialByUserIdStorageOperation.Interface {
    constructor(private table: CredentialsTable.Interface) {}

    async execute(params: { userId: string }) {
        await this.table.ensure();

        try {
            const row = await this.table.query().where("user_id", params.userId).first();

            return row ? toCredential(row) : null;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not load credential by user id.",
                code: "GET_CREDENTIAL_BY_USER_ID_ERROR"
            });
        }
    }
}

export const SqlGetCredentialByUserId = GetCredentialByUserIdStorageOperation.createImplementation({
    implementation: SqlGetCredentialByUserIdImpl,
    dependencies: [CredentialsTable]
});
