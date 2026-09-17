import WebinyError from "@webiny/error";
import { ListLivePasswordResetCodesStorageOperation } from "@webiny/self-hosted-auth";
import { toCode } from "./PasswordResetCodesTable.js";
import { PasswordResetCodesTable } from "./PasswordResetCodesTable.js";

class SqlListLivePasswordResetCodesImpl
    implements ListLivePasswordResetCodesStorageOperation.Interface
{
    constructor(private table: PasswordResetCodesTable.Interface) {}

    async execute(params: { email: string; now: string }) {
        await this.table.ensure();

        try {
            const rows = await this.table
                .query()
                .where("email", params.email)
                .whereNull("used_on")
                .where("expires_on", ">", params.now)
                .orderBy("created_on", "desc");

            return rows.map(toCode);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not load password reset codes.",
                code: "LIST_PASSWORD_RESET_CODES_ERROR"
            });
        }
    }
}

export const SqlListLivePasswordResetCodes =
    ListLivePasswordResetCodesStorageOperation.createImplementation({
        implementation: SqlListLivePasswordResetCodesImpl,
        dependencies: [PasswordResetCodesTable]
    });
