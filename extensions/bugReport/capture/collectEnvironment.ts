export interface IEnvironmentInfo {
    url: string;
    page: string;
    userAgent: string;
    viewport: string;
    language: string;
    timezone: string;
    capturedAt: string;
}

function readTimezone(): string {
    try {
        const options = Intl.DateTimeFormat().resolvedOptions();
        return options.timeZone;
    } catch {
        return "unknown";
    }
}

/* Everything the reporter would otherwise be asked for in the first triage comment. */
export function collectEnvironment(): IEnvironmentInfo {
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
