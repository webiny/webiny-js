import { createImplementation } from "@webiny/di";
import { IsRemotePulumiBackendService } from "~/abstractions/index.js";

/**
 * Service to check if a remote Pulumi backend is configured via environment variables.
 *
 * Checks for the following environment variables:
 * - WEBINY_CLI_PULUMI_BACKEND (canonical)
 * - WEBINY_CLI_PULUMI_BACKEND_URL
 * - WEBINY_PULUMI_BACKEND (legacy, kept for backwards compatibility)
 * - PULUMI_LOGIN (fallback for standard Pulumi configuration)
 */
export class DefaultIsRemotePulumiBackendService implements IsRemotePulumiBackendService.Interface {
    execute(): boolean {
        return !!(
            process.env.WEBINY_CLI_PULUMI_BACKEND ||
            process.env.WEBINY_CLI_PULUMI_BACKEND_URL ||
            process.env.WEBINY_PULUMI_BACKEND ||
            process.env.PULUMI_LOGIN
        );
    }
}

export const isRemotePulumiBackendService = createImplementation({
    abstraction: IsRemotePulumiBackendService,
    implementation: DefaultIsRemotePulumiBackendService,
    dependencies: []
});
