import type {
    GetPageOptions,
    IContentSdk,
    IDataProvider,
    ListPagesOptions,
    ListPagesResult,
    PublicPage
} from "~/types.js";
import { documentStoreManager } from "~/DocumentStoreManager.js";

export class LiveSdk implements IContentSdk {
    private dataProvider: IDataProvider;

    constructor(dataProvider: IDataProvider) {
        this.dataProvider = dataProvider;
    }

    async getPage(path: string, options?: GetPageOptions): Promise<PublicPage | null> {
        const page = await this.dataProvider.getPageByPath(path, options);
        if (page) {
            documentStoreManager.getStore<PublicPage>(page.properties.id).setDocument(page);
        }
        return page;
    }

    listPages(options?: ListPagesOptions): Promise<ListPagesResult> {
        return this.dataProvider.listPages(options);
    }
}
