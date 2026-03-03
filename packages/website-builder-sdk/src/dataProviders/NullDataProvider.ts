import type { IDataProvider, Page, PublicRedirect } from "~/types.js";

export class NullDataProvider implements IDataProvider {
    getPageById(): Promise<Page | null> {
        return Promise.resolve(null);
    }

    getPageByPath(): Promise<Page | null> {
        return Promise.resolve(null);
    }

    public async listPages() {
        return { data: [], meta: { hasMoreItems: false, totalCount: 0, cursor: null } };
    }

    listRedirects(): Promise<PublicRedirect[]> {
        return Promise.resolve([]);
    }
}
