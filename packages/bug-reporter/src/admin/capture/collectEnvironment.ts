import type { IReportedEnvironment } from "../../shared/types.js";

function readTimezone(): string {
    try {
        const options = Intl.DateTimeFormat().resolvedOptions();
        return options.timeZone;
    } catch {
        return "unknown";
    }
}

/* Everything the reporter would otherwise be asked for in the first triage comment. */
export function collectEnvironment(): IReportedEnvironment {
    return {
        url: window.location.href,
        page: document.title,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`,
        language: navigator.language,
        timezone: readTimezone(),
        capturedAt: new Date().toISOString()
    };
}
