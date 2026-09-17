import WebinyError from "@webiny/error";
import { CountPasswordResetCodesStorageOperation } from "@webiny/self-hosted-auth";
import { PasswordResetCodesTable } from "./PasswordResetCodesTable.js";

class SqlCountPasswordResetCodesImpl implements CountPasswordResetCodesStorageOperation.Interface {
    constructor(private table: PasswordResetCodesTable.Interface) {}

    async execute(params: { email: string; since: string }) {
        await this.table.ensure();

        try {
            const result = await this.table
                .query()
                .where("email", params.email)
                .where("created_on", ">=", params.since)
                .count({ total: "*" })
                .first();

            return Number(result?.total ?? 0);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not count password reset codes.",
                code: "COUNT_PASSWORD_RESET_CODES_ERROR"
            });
        }
    }
}

export const SqlCountPasswordResetCodes =
    CountPasswordResetCodesStorageOperation.createImplementation({
        implementation: SqlCountPasswordResetCodesImpl,
        dependencies: [PasswordResetCodesTable]
    });
