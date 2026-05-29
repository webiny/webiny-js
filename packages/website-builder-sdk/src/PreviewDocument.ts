import { getHeadersProvider } from "./headersProvider.js";

export class PreviewDocument {
    public readonly props: Record<string, string>;

    private constructor(prefix: string, query: URLSearchParams) {
        this.props = {};
        query.forEach((value, key) => {
            if (key.startsWith(prefix + ".")) {
                const strippedKey = key.slice(prefix.length + 1); // +1 for the dot
                this.props[strippedKey] = value as string;
            }
        });
    }

    static createFromParams(params: string): PreviewDocument {
        return new PreviewDocument("wb", new URLSearchParams(params));
    }

    static createFromWindow(): PreviewDocument {
        const query = new URLSearchParams(window.location.search);
        return new PreviewDocument("wb", query);
    }

    static async createFromHeaders(): Promise<PreviewDocument> {
        const headersProvider = getHeadersProvider();
        const headers = await headersProvider();
        const previewFromHeaders = headers.get("X-Preview-Params");

        return new PreviewDocument("wb", new URLSearchParams(previewFromHeaders ?? ""));
    }

    matches(params: Record<string, string>) {
        for (const [key, value] of Object.entries(params)) {
            if (this.props[key] !== value) {
                return false;
            }
        }
        return true;
    }

    getId() {
        return this.props.id;
    }
}
