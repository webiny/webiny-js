import { ISearchStateGateway } from "./ISearchStateGateway";

const SEARCH_PARAM_KEY = "search";

export class QueryStringSearchStateGateway implements ISearchStateGateway {
    get(): string {
        if (typeof window === "undefined") {
            return "";
        }
        const params = new URLSearchParams(window.location.search);
        return params.get(SEARCH_PARAM_KEY) || "";
    }

    async set(value: string): Promise<void> {
        if (typeof window === "undefined") {
            return;
        }
        const url = new URL(window.location.href);
        if (value) {
            url.searchParams.set(SEARCH_PARAM_KEY, value);
        } else {
            url.searchParams.delete(SEARCH_PARAM_KEY);
        }
        window.history.replaceState({}, "", url.toString());
    }
}
