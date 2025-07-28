import {
    GetPageOptions,
    IContentSdk,
    IDataProvider,
    ListPagesOptions,
    PublicPage
} from "~/types.js";
import { documentStoreManager } from "~/DocumentStoreManager";

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

    listPages(options?: ListPagesOptions): Promise<PublicPage[]> {
        return this.dataProvider.listPages(options);
    }
}
