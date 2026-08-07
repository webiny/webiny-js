export class RemoteComponentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RemoteComponentError";
    }
}

export class ManifestFetchError extends RemoteComponentError {
    public readonly url: string;
    public readonly statusCode: number | undefined;

    constructor(url: string, statusCode?: number, cause?: Error) {
        const message = statusCode
            ? `Failed to fetch manifest from ${url}: HTTP ${statusCode}.`
            : `Failed to fetch manifest from ${url}.`;
        super(message);
        this.name = "ManifestFetchError";
        this.url = url;
        this.statusCode = statusCode;
        if (cause) {
            this.cause = cause;
        }
    }
}

export class ManifestValidationError extends RemoteComponentError {
    public readonly url: string;

    constructor(url: string, reason: string) {
        super(`Invalid manifest from ${url}: ${reason}`);
        this.name = "ManifestValidationError";
        this.url = url;
    }
}

export class BundleFetchError extends RemoteComponentError {
    public readonly url: string;
    public readonly statusCode: number | undefined;

    constructor(url: string, statusCode?: number, cause?: Error) {
        const message = statusCode
            ? `Failed to fetch server bundle from ${url}: HTTP ${statusCode}.`
            : `Failed to fetch server bundle from ${url}.`;
        super(message);
        this.name = "BundleFetchError";
        this.url = url;
        this.statusCode = statusCode;
        if (cause) {
            this.cause = cause;
        }
    }
}

export class BundleHashMismatchError extends RemoteComponentError {
    public readonly url: string;
    public readonly expected: string;
    public readonly actual: string;

    constructor(url: string, expected: string, actual: string) {
        super(`Server bundle hash mismatch for ${url}. Expected ${expected}, got ${actual}.`);
        this.name = "BundleHashMismatchError";
        this.url = url;
        this.expected = expected;
        this.actual = actual;
    }
}

export class BundleSizeLimitError extends RemoteComponentError {
    public readonly url: string;
    public readonly size: number;
    public readonly limit: number;

    constructor(url: string, size: number, limit: number) {
        super(`Server bundle from ${url} exceeds size limit: ${size} bytes (limit: ${limit}).`);
        this.name = "BundleSizeLimitError";
        this.url = url;
        this.size = size;
        this.limit = limit;
    }
}

export class SdkVersionMismatchError extends RemoteComponentError {
    public readonly expected: string;
    public readonly actual: string;

    constructor(expected: string, actual: string) {
        super(
            `Remote bundle SDK version mismatch. Host supports "${expected}", bundle requires "${actual}".`
        );
        this.name = "SdkVersionMismatchError";
        this.expected = expected;
        this.actual = actual;
    }
}

export class BundleImportError extends RemoteComponentError {
    public readonly filePath: string;

    constructor(filePath: string, cause: Error) {
        super(`Failed to import server bundle from ${filePath}.`);
        this.name = "BundleImportError";
        this.filePath = filePath;
        this.cause = cause;
    }
}
