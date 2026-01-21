export const shouldShowLogs = (): boolean => {
    /**
     * Don't show logs during tests, really no point.
     */
    if (process.env.TESTING === "true") {
        return false;
    }
    return process.env.DEBUG === "true";
};
