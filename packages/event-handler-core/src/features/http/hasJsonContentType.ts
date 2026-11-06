/**
 * Whether the request's `content-type` is `application/json`. Parameters such as `charset` are
 * allowed, and both the header name and the media type are matched case-insensitively, because the
 * casing that reaches us depends on the transport and on the client.
 */
export function hasJsonContentType(headers: Record<string, string> | undefined): boolean {
    if (!headers) {
        return false;
    }
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() !== "content-type") {
            continue;
        }
        const value = headers[key] ?? "";
        const mediaType = value.split(";")[0].trim().toLowerCase();
        return mediaType === "application/json";
    }
    return false;
}
