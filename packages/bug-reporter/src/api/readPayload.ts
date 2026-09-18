import { isSupportedScreenshotMediaType } from "./screenshotMediaTypes.js";
import type { IBugReportPayload } from "../shared/types.js";
import type { IReportedEnvironment } from "../shared/types.js";
import type { IReportedEvent } from "../shared/types.js";
import type { IReportedScreenshot } from "../shared/types.js";

/* One screenshot is a Lambda-held GitHub round trip, so a report cannot carry an unbounded pile. */
const MAX_SCREENSHOTS = 10;

/* Enough to keep a report readable without letting a caller post a novel into an issue. */
const MAX_DESCRIPTION = 4000;

function readString(source: Record<string, unknown>, key: string): string {
    const value = source[key];
    if (typeof value === "string") {
        return value;
    }
    return "";
}

/*
 * Read field by field rather than asserting the shape. Everything here is rendered straight into
 * issue markdown, so a caller that sends `{ url: {...} }` would otherwise put "[object Object]" —
 * or worse — in front of whoever triages the report.
 */
function readEnvironment(value: unknown): IReportedEnvironment | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const source = value as Record<string, unknown>;

    return {
        url: readString(source, "url"),
        page: readString(source, "page"),
        userAgent: readString(source, "userAgent"),
        viewport: readString(source, "viewport"),
        language: readString(source, "language"),
        timezone: readString(source, "timezone"),
        capturedAt: readString(source, "capturedAt")
    };
}

function readEvents(value: unknown): IReportedEvent[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const events: IReportedEvent[] = [];
    for (const item of value) {
        if (!item || typeof item !== "object") {
            continue;
        }
        const candidate = item as Partial<IReportedEvent>;
        if (typeof candidate.kind !== "string" || typeof candidate.summary !== "string") {
            continue;
        }
        const at = typeof candidate.at === "number" ? candidate.at : Date.now();
        const event: IReportedEvent = { at, kind: candidate.kind, summary: candidate.summary };
        if (typeof candidate.detail === "string") {
            event.detail = candidate.detail;
        }
        events.push(event);
    }

    return events;
}

function readScreenshots(value: unknown): IReportedScreenshot[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const screenshots: IReportedScreenshot[] = [];
    for (const item of value.slice(0, MAX_SCREENSHOTS)) {
        if (!item || typeof item !== "object") {
            continue;
        }
        const candidate = item as Partial<IReportedScreenshot>;
        if (typeof candidate.mediaType !== "string" || typeof candidate.base64 !== "string") {
            continue;
        }
        if (!isSupportedScreenshotMediaType(candidate.mediaType)) {
            continue;
        }
        screenshots.push({ mediaType: candidate.mediaType, base64: candidate.base64 });
    }

    return screenshots;
}

/*
 * Everything the browser sends is untrusted, and a bad field must not take the stream down after it
 * has committed to a 200. Anything unrecognised is dropped rather than rejected: a report with a
 * mangled event is still worth filing.
 *
 * Returns null only when the body is not shaped like a report at all. Whether the result is worth
 * filing — whether anything was actually said — is the use case's call, not the parser's.
 */
export function readPayload(body: unknown): IBugReportPayload | null {
    if (!body || typeof body !== "object") {
        return null;
    }

    const source = body as Record<string, unknown>;
    const environment = readEnvironment(source.environment);

    if (!environment) {
        return null;
    }

    const description = readString(source, "description").trim();

    return {
        description: description.slice(0, MAX_DESCRIPTION),
        reportedAt: typeof source.reportedAt === "number" ? source.reportedAt : Date.now(),
        events: readEvents(source.events),
        environment,
        screenshots: readScreenshots(source.screenshots)
    };
}
