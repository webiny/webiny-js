import WebinyError from "@webiny/error";
import { SaveCredentialStorageOperation } from "@webiny/self-hosted-auth";
import type { StorageCredential } from "@webiny/self-hosted-auth";
import { toRow } from "./CredentialsTable.js";
import { CredentialsTable } from "./CredentialsTable.js";

class SqlSaveCredentialImpl implements SaveCredentialStorageOperation.Interface {
    constructor(private table: CredentialsTable.Interface) {}

    async execute(params: { credential: StorageCredential }) {
        await this.table.ensure();

        try {
            const row = toRow(params.credential);

            await this.table
                .query()
                .insert(row)
                .onConflict(["user_id"])
                .merge({ email: row.email, data: row.data });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not save credential.",
                code: "SAVE_CREDENTIAL_ERROR"
            });
        }
    }
}

export const SqlSaveCredential = SaveCredentialStorageOperation.createImplementation({
    implementation: SqlSaveCredentialImpl,
    dependencies: [CredentialsTable]
});
