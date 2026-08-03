import { BaseError } from "@webiny/feature/api";

/**
 * Extraction errors, each written to be read by the person who triggered it.
 *
 * The brief is specific about this: an error must say what happened and what to do about it. A user
 * who pointed us at their marketing site and got "extraction failed" has learned nothing, and will
 * either retry identically or give up.
 *
 * The structured `data` is not decoration either — the Admin UI needs the offending URL or vendor to
 * offer the right next action, and parsing it back out of a sentence would be worse.
 */

export class ExtractionNotConfiguredError extends BaseError<{ detail: string }> {
    override readonly code = "ThemeExtraction/NotConfigured" as const;

    constructor(detail: string) {
        super({
            message:
                `Theme extraction is not configured: ${detail}. ` +
                "Configure an AI model for theme extraction in settings, then try again.",
            data: { detail }
        });
    }
}

export class ExtractionInProgressError extends BaseError<{ currentId: string }> {
    override readonly code = "ThemeExtraction/InProgress" as const;

    constructor(currentId: string) {
        super({
            message:
                `Another theme extraction (${currentId}) is already running for this tenant. ` +
                "Extraction uses a headless browser and runs one at a time. Wait for it to finish, " +
                "or cancel it, then try again.",
            data: { currentId }
        });
    }
}

export class ExtractionBlockedByRobotsError extends BaseError<{ url: string }> {
    override readonly code = "ThemeExtraction/BlockedByRobots" as const;

    constructor(url: string) {
        super({
            message:
                `${url} is disallowed by that site's robots.txt, so it was not fetched. ` +
                "If you own the site, allow Webiny's crawler in robots.txt, or extract from a URL that " +
                "is not excluded.",
            data: { url }
        });
    }
}

export class ExtractionNothingFoundError extends BaseError<{
    url: string;
    candidateCount: number;
}> {
    override readonly code = "ThemeExtraction/NothingFound" as const;

    constructor(url: string, candidateCount: number) {
        super({
            message:
                `Nothing usable was found at ${url} — only ${candidateCount} styled element(s) were ` +
                "visible. The page may render entirely after load, require a login, or be mostly one " +
                "image. Try a content-heavy page such as the homepage or a pricing page.",
            data: { url, candidateCount }
        });
    }
}

export class ExtractionModelFailedError extends BaseError<{ detail: string }> {
    override readonly code = "ThemeExtraction/ModelFailed" as const;

    constructor(detail: string) {
        super({
            message:
                `The AI model could not turn the crawl into a theme: ${detail}. ` +
                "The crawl itself succeeded and has been kept, so retrying will not re-read the site.",
            data: { detail }
        });
    }
}

export class ExtractionStorageError extends BaseError<{ operation: string; detail: string }> {
    override readonly code = "ThemeExtraction/StorageError" as const;

    constructor(operation: string, detail: string) {
        super({
            message: `Theme extraction could not ${operation}: ${detail}.`,
            data: { operation, detail }
        });
    }
}

export class ExtractionInvalidUrlError extends BaseError<{ url: string }> {
    override readonly code = "ThemeExtraction/InvalidUrl" as const;

    constructor(url: string) {
        super({
            message:
                `"${url}" is not a URL we can fetch. Enter a full address including the scheme, ` +
                "for example https://example.com.",
            data: { url }
        });
    }
}

export type ExtractionError =
    | ExtractionNotConfiguredError
    | ExtractionInProgressError
    | ExtractionBlockedByRobotsError
    | ExtractionNothingFoundError
    | ExtractionModelFailedError
    | ExtractionStorageError
    | ExtractionInvalidUrlError;
