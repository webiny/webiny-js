export const WEBINY_VERSION_HEADER = "x-webiny-version";

export const getWebinyVersionHeaders = () => {
    const enable: string | undefined = process.env.WEBINY_ENABLE_VERSION_HEADER;
    const version: string | undefined = process.env.WEBINY_VERSION;
    /**
     * Disable version headers by default.
     */
    if (enable !== "true" || !version) {
        return {};
    }
    return {
        "x-webiny-version": version
    };
};
