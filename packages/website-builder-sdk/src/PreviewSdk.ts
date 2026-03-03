import type {
    IContentSdk,
    IDataProvider,
    ListPagesOptions,
    ListPagesResult,
    PublicPage
} from "~/types.js";
import { PreviewDocument } from "~/PreviewDocument.js";

export class PreviewSdk implements IContentSdk {
    private liveSdk: IContentSdk;
    private dataProvider: IDataProvider;

    constructor(dataProvider: IDataProvider, liveSdk: IContentSdk) {
        this.liveSdk = liveSdk;
        this.dataProvider = dataProvider;
    }

    async getPage(path: string): Promise<PublicPage | null> {
        const previewDocument = await PreviewDocument.createFromHeaders();
        if (!previewDocument.matches({ type: "page", path })) {
            return this.liveSdk.getPage(path);
        }
        return this.dataProvider.getPageById(previewDocument.getId());
    }

    async listPages(options?: ListPagesOptions): Promise<ListPagesResult> {
        return this.liveSdk.listPages(options);
    }
}
