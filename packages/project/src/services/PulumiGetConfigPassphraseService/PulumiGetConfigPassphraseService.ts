import { createImplementation } from "@webiny/di";
import { PulumiGetConfigPassphraseService } from "~/abstractions/index.js";

export class DefaultPulumiGetConfigPassphraseService
    implements PulumiGetConfigPassphraseService.Interface
{
    execute() {
        return process.env.PULUMI_CONFIG_PASSPHRASE || "webiny";
    }
}

export const pulumiGetConfigPassphraseService = createImplementation({
    abstraction: PulumiGetConfigPassphraseService,
    implementation: DefaultPulumiGetConfigPassphraseService,
    dependencies: []
});
