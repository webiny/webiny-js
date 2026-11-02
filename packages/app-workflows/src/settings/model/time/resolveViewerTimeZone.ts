const FALLBACK_TIME_ZONE = "UTC";

/*
 * The viewer's IANA timezone, the one zone the settings page computes, shows and names dates in
 * (R319). `UTC` when the browser resolves none or `Intl` throws (D179). The only time function
 * that reads the environment.
 */
export const resolveViewerTimeZone = (): string => {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!timeZone) {
            return FALLBACK_TIME_ZONE;
        }
        return timeZone;
    } catch {
        return FALLBACK_TIME_ZONE;
    }
};
