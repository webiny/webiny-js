import type { IQueryGateway } from "~/features/pages/listPages/IQueryGateway.js";

export class QueryStringGateway implements IQueryGateway {
    private readonly paramName: string;

    constructor(paramName: string) {
        this.paramName = paramName;
    }

    async get(): Promise<string> {
        if (typeof window === "undefined") {
            return "";
        }
        const params = new URLSearchParams(window.location.search);
        return params.get(this.paramName) || "";
    }

    async set(value?: string): Promise<void> {
        if (typeof window === "undefined") {
            return;
        }

        const url = new URL(window.location.href);
        const params = url.searchParams;

        if (value) {
            params.set(this.paramName, value);
        } else {
            params.delete(this.paramName);
        }

        const newUrl = `${url.pathname}?${params.toString()}${url.hash}`;
        window.history.replaceState({}, "", newUrl);
    }
}
