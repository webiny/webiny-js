import WebinyError from "@webiny/error";
import { IncrementPasswordResetCodeAttemptsStorageOperation } from "@webiny/self-hosted-auth";
import { PasswordResetCodesTable } from "./PasswordResetCodesTable.js";

class SqlIncrementPasswordResetCodeAttemptsImpl
    implements IncrementPasswordResetCodeAttemptsStorageOperation.Interface
{
    constructor(private table: PasswordResetCodesTable.Interface) {}

    async execute(params: { id: string }) {
        await this.table.ensure();

        try {
            // Incremented in the database rather than read, added to, and written back, so that
            // two guesses arriving at once cannot both spend the same attempt.
            await this.table.query().where("id", params.id).increment("attempts", 1);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not record a password reset code attempt.",
                code: "INCREMENT_PASSWORD_RESET_CODE_ATTEMPTS_ERROR"
            });
        }
    }
}

export const SqlIncrementPasswordResetCodeAttempts =
    IncrementPasswordResetCodeAttemptsStorageOperation.createImplementation({
        implementation: SqlIncrementPasswordResetCodeAttemptsImpl,
        dependencies: [PasswordResetCodesTable]
    });
