import type {
    IContentSdk,
    ListPagesResult,
    Page,
    PublicRedirect,
    ResolvedComponent
} from "./types.js";

export class NullSdk implements IContentSdk {
    async getPage(): Promise<Page | null> {
        return null;
    }

    listPages(): Promise<ListPagesResult> {
        return Promise.resolve({
            data: [],
            meta: { hasMoreItems: false, totalCount: 0, cursor: null }
        });
    }

    listRedirects(): Promise<PublicRedirect[]> {
        return Promise.resolve([]);
    }

    registerComponent(): void {}

    resolveElement(): ResolvedComponent[] | null {
        return null;
    }
}
