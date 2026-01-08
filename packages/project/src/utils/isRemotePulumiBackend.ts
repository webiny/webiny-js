/**
 * Checks if a remote Pulumi backend is configured via environment variables.
 * 
 * This function checks for the following environment variables in order:
 * - WEBINY_CLI_PULUMI_BACKEND
 * - WEBINY_CLI_PULUMI_BACKEND_URL
 * - PULUMI_LOGIN (fallback for standard Pulumi configuration)
 * 
 * @returns {boolean} True if a remote Pulumi backend is configured, false otherwise
 */
export const isRemotePulumiBackend = (): boolean => {
    return !!(
        process.env.WEBINY_CLI_PULUMI_BACKEND ||
        process.env.WEBINY_CLI_PULUMI_BACKEND_URL ||
        process.env.PULUMI_LOGIN
    );
};
