import WebinyError from "@webiny/error";
import { MarkPasswordResetCodesUsedStorageOperation } from "@webiny/self-hosted-auth";
import { PasswordResetCodesTable } from "./PasswordResetCodesTable.js";

class SqlMarkPasswordResetCodesUsedImpl
    implements MarkPasswordResetCodesUsedStorageOperation.Interface
{
    constructor(private table: PasswordResetCodesTable.Interface) {}

    async execute(params: { email: string; usedOn: string }) {
        await this.table.ensure();

        try {
            await this.table
                .query()
                .where("email", params.email)
                .whereNull("used_on")
                .update({ used_on: params.usedOn });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not mark password reset codes as used.",
                code: "MARK_PASSWORD_RESET_CODES_USED_ERROR"
            });
        }
    }
}

export const SqlMarkPasswordResetCodesUsed =
    MarkPasswordResetCodesUsedStorageOperation.createImplementation({
        implementation: SqlMarkPasswordResetCodesUsedImpl,
        dependencies: [PasswordResetCodesTable]
    });
