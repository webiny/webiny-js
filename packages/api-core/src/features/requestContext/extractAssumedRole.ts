import { RawAssumedRole } from "./abstractions.js";

export const ASSUME_ROLE_HEADER = "x-webiny-assume-role";

type HeaderValue = string | string[] | undefined;
type Headers = Record<string, HeaderValue> | undefined;

function readHeader(headers: Headers, name: string): string | null {
    if (!headers) {
        return null;
    }

    /*
     * Header names are case-insensitive, and the casing that reaches us depends on the transport
     * and on the client, so match on the lowercased key rather than guessing a spelling. Node's
     * IncomingMessage also hands back an array when a header repeats.
     */
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() !== name) {
            continue;
        }

        const value = headers[key];
        if (Array.isArray(value)) {
            return value[0] ?? null;
        }

        return value ?? null;
    }

    return null;
}

/**
 * Reads the `x-webiny-assume-role` header and parses it into the role or team whose permissions
 * should be previewed. The value is `role:<id>` or `team:<id>`.
 *
 * Anything else parses to null, which leaves the caller's own permissions untouched. Lives in
 * api-core rather than in a transport package so the HTTP transports cannot drift on the format or
 * on header casing.
 */
export function extractAssumedRole(headers: Headers): RawAssumedRole.Request | null {
    const value = readHeader(headers, ASSUME_ROLE_HEADER);
    if (!value) {
        return null;
    }

    const separatorIndex = value.indexOf(":");
    if (separatorIndex < 1) {
        return null;
    }

    const type = value.slice(0, separatorIndex).trim();
    const id = value.slice(separatorIndex + 1).trim();

    if (id === "") {
        return null;
    }

    if (type === "role") {
        return { type: "role", id };
    }

    if (type === "team") {
        return { type: "team", id };
    }

    return null;
}
