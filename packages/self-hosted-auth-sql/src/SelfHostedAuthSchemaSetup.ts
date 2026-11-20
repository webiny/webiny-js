import { SqlSchemaSetup } from "@webiny/api-core-sql";
import { CredentialsTable } from "./credentials/CredentialsTable.js";
import { PasswordResetCodesTable } from "./passwordResetCodes/PasswordResetCodesTable.js";

/** The `selfHostedAuth` schema setup step: the credentials and password reset codes tables. */
class SelfHostedAuthSchemaSetupImpl implements SqlSchemaSetup.Interface {
    public readonly name = "selfHostedAuth";

    public constructor(
        private readonly credentials: CredentialsTable.Interface,
        private readonly passwordResetCodes: PasswordResetCodesTable.Interface
    ) {}

    public async setup(): Promise<void> {
        await this.credentials.ensure();
        await this.passwordResetCodes.ensure();
    }
}

export const SelfHostedAuthSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: SelfHostedAuthSchemaSetupImpl,
    dependencies: [CredentialsTable, PasswordResetCodesTable]
});
