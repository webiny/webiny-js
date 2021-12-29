export const WEBINY_VERSION_HEADER = "x-webiny-version";
export interface Headers {
    [WEBINY_VERSION_HEADER]: string;
}
export const getWebinyVersionHeaders = (): Headers => {
    const enable: string | undefined = process.env.WEBINY_ENABLE_VERSION_HEADER;
    const version: string | undefined = process.env.WEBINY_VERSION;
    /**
     * Disable version headers by default.
     */
    if (enable !== "true" || !version) {
        return {} as Headers;
    }
    return {
        [WEBINY_VERSION_HEADER]: version
    };
};
