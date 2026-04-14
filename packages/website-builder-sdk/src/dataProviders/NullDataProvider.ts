import type { IDataProvider, PublicRedirect } from "~/types.js";
import type { PublicPage } from "~/types.js";

export class NullDataProvider implements IDataProvider {
    getPageById(): Promise<PublicPage | null> {
        return Promise.resolve(null);
    }

    getPageByPath(): Promise<PublicPage | null> {
        return Promise.resolve(null);
    }

    public async listPages() {
        return { data: [], meta: { hasMoreItems: false, totalCount: 0, cursor: null } };
    }

    listRedirects(): Promise<PublicRedirect[]> {
        return Promise.resolve([]);
    }
}
