import { createImplementation } from "@webiny/di";
import { PulumiGetSecretsProviderService } from "~/abstractions/services/PulumiGetSecretsProviderService.js";

export class DefaultPulumiGetSecretsProviderService
    implements PulumiGetSecretsProviderService.Interface
{
    execute() {
        return process.env.PULUMI_SECRETS_PROVIDER || "passphrase";
    }
}

export const pulumiGetSecretsProviderService = createImplementation({
    abstraction: PulumiGetSecretsProviderService,
    implementation: DefaultPulumiGetSecretsProviderService,
    dependencies: []
});
