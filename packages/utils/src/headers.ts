export const WBY_VERSION_HEADER = "x-webiny-version";

export const getWebinyVersionHeaders = () => {
    const enable: string | undefined = process.env.WBY_ENABLE_VERSION_HEADER;
    const version: string | undefined = process.env.WBY_VERSION;
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
