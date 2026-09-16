import WebinyError from "@webiny/error";
import { GetCredentialByEmailStorageOperation } from "@webiny/self-hosted-auth";
import { toCredential } from "./CredentialsTable.js";
import { CredentialsTable } from "./CredentialsTable.js";

class SqlGetCredentialByEmailImpl implements GetCredentialByEmailStorageOperation.Interface {
    constructor(private table: CredentialsTable.Interface) {}

    async execute(params: { email: string }) {
        await this.table.ensure();

        try {
            const row = await this.table.query().where("email", params.email).first();

            return row ? toCredential(row) : null;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not load credential by email.",
                code: "GET_CREDENTIAL_BY_EMAIL_ERROR"
            });
        }
    }
}

export const SqlGetCredentialByEmail = GetCredentialByEmailStorageOperation.createImplementation({
    implementation: SqlGetCredentialByEmailImpl,
    dependencies: [CredentialsTable]
});
