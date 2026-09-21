import WebinyError from "@webiny/error";
import { DeleteCredentialStorageOperation } from "@webiny/self-hosted-auth";
import { CredentialsTable } from "./CredentialsTable.js";

class SqlDeleteCredentialImpl implements DeleteCredentialStorageOperation.Interface {
    constructor(private table: CredentialsTable.Interface) {}

    async execute(params: { userId: string }) {
        await this.table.ensure();

        try {
            await this.table.query().where("user_id", params.userId).delete();
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete credential.",
                code: "DELETE_CREDENTIAL_ERROR"
            });
        }
    }
}

export const SqlDeleteCredential = DeleteCredentialStorageOperation.createImplementation({
    implementation: SqlDeleteCredentialImpl,
    dependencies: [CredentialsTable]
});
