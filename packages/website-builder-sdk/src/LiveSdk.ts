import type {
    GetLayoutParams,
    GetPageOptions,
    IContentSdk,
    IDataProvider,
    ListPagesOptions,
    ListPagesResult,
    PublicLayout,
    PublicPage
} from "~/types.js";
import type { DocumentStoreManager } from "~/DocumentStoreManager.js";
import { documentStoreManager } from "~/DocumentStoreManager.js";

export class LiveSdk implements IContentSdk {
    private dataProvider: IDataProvider;
    private documentStoreManager: DocumentStoreManager;

    constructor(dataProvider: IDataProvider, stores: DocumentStoreManager = documentStoreManager) {
        this.dataProvider = dataProvider;
        this.documentStoreManager = stores;
    }

    async getPage(path: string, options?: GetPageOptions): Promise<PublicPage | null> {
        const page = await this.dataProvider.getPageByPath(path, options);
        if (page) {
            this.documentStoreManager.getStore<PublicPage>(page.properties.id).setDocument(page);
        }
        return page;
    }

    getLayout(params: GetLayoutParams): Promise<PublicLayout | null> {
        return this.dataProvider.getLayoutBySlug(params);
    }

    listPages(options?: ListPagesOptions): Promise<ListPagesResult> {
        return this.dataProvider.listPages(options);
    }
}
