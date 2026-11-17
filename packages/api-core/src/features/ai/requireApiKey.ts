/**
 * The built-in vendors take their key from the connection only. Without this check, each provider
 * SDK would fall back to its own environment variable (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, ...),
 * so a key set on the API function for some other tool would quietly be used for AI Power-Ups.
 */
export const requireApiKey = (vendorName: string, apiKey: string | undefined): string => {
    if (!apiKey) {
        throw new Error(
            `No API key for ${vendorName}. Add a ${vendorName} connection in AI Power-Ups settings.`
        );
    }
    return apiKey;
};
