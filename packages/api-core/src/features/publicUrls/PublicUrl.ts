/**
 * A public URL of the API or the Admin app. Usually an origin (https://api.example.com), but it can
 * carry a path when the app is served under a prefix (the standalone dev proxy serves the API at
 * http://localhost:3001/api). Never has a trailing slash.
 *
 * Always an object, never `null`: a URL the deployment doesn't know is an "unknown" `PublicUrl`
 * whose string forms are empty. Check `isKnown()` only where unknown needs different output.
 */
export class PublicUrl {
    private constructor(private readonly url: URL | null) {}

    /** Unknown for anything that isn't an absolute http(s) URL. */
    static from(value: unknown): PublicUrl {
        if (typeof value !== "string" || !value.trim()) {
            return PublicUrl.unknown();
        }

        const trimmed = value.trim();
        let url: URL;
        try {
            url = new URL(trimmed);
        } catch {
            return PublicUrl.unknown();
        }

        if (url.protocol !== "https:" && url.protocol !== "http:") {
            return PublicUrl.unknown();
        }

        url.pathname = url.pathname.replace(/\/+$/, "");
        url.search = "";
        url.hash = "";

        return new PublicUrl(url);
    }

    static unknown(): PublicUrl {
        return new PublicUrl(null);
    }

    isKnown(): boolean {
        return this.url !== null;
    }

    /** Hostname plus port, e.g. `api.example.com` or `localhost:3001`. Empty when unknown. */
    get host(): string {
        return this.url?.host ?? "";
    }

    /** Appends a path, e.g. `join("/files/")` gives `https://api.example.com/files/`. Empty when unknown. */
    join(path: string): string {
        if (!this.url) {
            return "";
        }

        return this.toString() + "/" + path.replace(/^\/+/, "");
    }

    /** The URL, or `fallback` when unknown, e.g. a placeholder in generated config. */
    orElse(fallback: string): string {
        return this.url ? this.toString() : fallback;
    }

    /** Empty when unknown. */
    toString(): string {
        if (!this.url) {
            return "";
        }

        return this.url.origin + this.url.pathname.replace(/\/+$/, "");
    }
}
