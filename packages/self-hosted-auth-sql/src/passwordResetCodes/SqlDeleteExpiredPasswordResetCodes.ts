import WebinyError from "@webiny/error";
import { DeleteExpiredPasswordResetCodesStorageOperation } from "@webiny/self-hosted-auth";
import { PasswordResetCodesTable } from "./PasswordResetCodesTable.js";

class SqlDeleteExpiredPasswordResetCodesImpl
    implements DeleteExpiredPasswordResetCodesStorageOperation.Interface
{
    constructor(private table: PasswordResetCodesTable.Interface) {}

    async execute(params: { before: string }) {
        await this.table.ensure();

        try {
            await this.table.query().where("expires_on", "<", params.before).delete();
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete expired password reset codes.",
                code: "DELETE_PASSWORD_RESET_CODES_ERROR"
            });
        }
    }
}

export const SqlDeleteExpiredPasswordResetCodes =
    DeleteExpiredPasswordResetCodesStorageOperation.createImplementation({
        implementation: SqlDeleteExpiredPasswordResetCodesImpl,
        dependencies: [PasswordResetCodesTable]
    });
