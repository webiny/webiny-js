import type { IReportedEnvironment } from "../../shared/types.js";

function readTimezone(): string {
    try {
        const options = Intl.DateTimeFormat().resolvedOptions();
        return options.timeZone;
    } catch {
        return "unknown";
    }
}

/*
 * A query parameter named like a credential has its value replaced rather than the whole query
 * being dropped. Webiny's admin puts ids in the query string, and "which entry" is most of what
 * makes the URL worth capturing, but a URL is also where a one-off token ends up when a flow
 * passes one, and this URL is rendered into a public issue.
 */
const SECRET_PARAM_PATTERN = /token|secret|password|signature|credential|(^|_|-)(key|code|auth)$/i;

export function redactUrl(href: string): string {
    let url: URL;
    try {
        url = new URL(href);
    } catch {
        return href;
    }

    for (const name of [...url.searchParams.keys()]) {
        if (SECRET_PARAM_PATTERN.test(name)) {
            url.searchParams.set(name, "[redacted]");
        }
    }

    /* The fragment is never worth triage and is where implicit-flow tokens land. */
    url.hash = "";

    return url.toString();
}

/* Everything the reporter would otherwise be asked for in the first triage comment. */
export function collectEnvironment(): IReportedEnvironment {
    return {
        url: redactUrl(window.location.href),
        page: document.title,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`,
        language: navigator.language,
        timezone: readTimezone(),
        capturedAt: new Date().toISOString()
    };
}
