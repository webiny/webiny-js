/**
 * A public URL of the API or the Admin app. Usually an origin (https://api.example.com), but it can
 * carry a path when the app is served under a prefix (the standalone dev proxy serves the API at
 * http://localhost:3001/api). Never has a trailing slash.
 */
export class PublicUrl {
    private constructor(private readonly url: URL) {}

    /** `null` for anything that isn't an absolute http(s) URL, so callers handle one "unknown" case. */
    static from(value: unknown): PublicUrl | null {
        if (typeof value !== "string" || !value.trim()) {
            return null;
        }

        let url: URL;
        try {
            url = new URL(value.trim());
        } catch {
            return null;
        }

        if (url.protocol !== "https:" && url.protocol !== "http:") {
            return null;
        }

        url.pathname = url.pathname.replace(/\/+$/, "");
        url.search = "";
        url.hash = "";

        return new PublicUrl(url);
    }

    /** Hostname plus port, e.g. `api.example.com` or `localhost:3001`. */
    get host(): string {
        return this.url.host;
    }

    /** Appends a path, e.g. `join("/files/")` gives `https://api.example.com/files/`. */
    join(path: string): string {
        return this.toString() + "/" + path.replace(/^\/+/, "");
    }

    toString(): string {
        return this.url.origin + this.url.pathname.replace(/\/+$/, "");
    }
}
