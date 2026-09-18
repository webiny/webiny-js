import WebinyError from "@webiny/error";
import { SavePasswordResetCodeStorageOperation } from "@webiny/self-hosted-auth";
import type { StoredPasswordResetCode } from "@webiny/self-hosted-auth";
import { toRow } from "./PasswordResetCodesTable.js";
import { PasswordResetCodesTable } from "./PasswordResetCodesTable.js";

class SqlSavePasswordResetCodeImpl implements SavePasswordResetCodeStorageOperation.Interface {
    constructor(private table: PasswordResetCodesTable.Interface) {}

    async execute(params: { code: StoredPasswordResetCode }) {
        await this.table.ensure();

        try {
            await this.table.query().insert(toRow(params.code));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not save password reset code.",
                code: "SAVE_PASSWORD_RESET_CODE_ERROR"
            });
        }
    }
}

export const SqlSavePasswordResetCode = SavePasswordResetCodeStorageOperation.createImplementation({
    implementation: SqlSavePasswordResetCodeImpl,
    dependencies: [PasswordResetCodesTable]
});
