import WebinyError from "@webiny/error";
import { SetPasswordResetCodeHashStorageOperation } from "@webiny/self-hosted-auth";
import { PasswordResetCodesTable } from "./PasswordResetCodesTable.js";

class SqlSetPasswordResetCodeHashImpl
    implements SetPasswordResetCodeHashStorageOperation.Interface
{
    constructor(private table: PasswordResetCodesTable.Interface) {}

    async execute(params: { id: string; codeHash: string }) {
        await this.table.ensure();

        try {
            // The empty-hash condition is in the update itself, so two runs of the same task
            // cannot both set a code: the second one updates nothing.
            const updated = await this.table
                .query()
                .where("id", params.id)
                .where("code_hash", "")
                .update({ code_hash: params.codeHash });

            return updated > 0;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not set the password reset code.",
                code: "SET_PASSWORD_RESET_CODE_HASH_ERROR"
            });
        }
    }
}

export const SqlSetPasswordResetCodeHash =
    SetPasswordResetCodeHashStorageOperation.createImplementation({
        implementation: SqlSetPasswordResetCodeHashImpl,
        dependencies: [PasswordResetCodesTable]
    });
