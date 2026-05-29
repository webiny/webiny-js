import type {
    IContentSdk,
    IDataProvider,
    ListPagesOptions,
    ListPagesResult,
    PublicPage
} from "~/types.js";
import { PreviewDocument } from "~/PreviewDocument.js";
import { environment } from "./Environment.js";

export class PreviewSdk implements IContentSdk {
    private liveSdk: IContentSdk;
    private dataProvider: IDataProvider;
    private previewParams: string | undefined;

    constructor(dataProvider: IDataProvider, liveSdk: IContentSdk, previewParams?: string) {
        this.liveSdk = liveSdk;
        this.dataProvider = dataProvider;
        this.previewParams = previewParams;
    }

    async getPage(path: string): Promise<PublicPage | null> {
        let previewDocument: PreviewDocument;

        if (this.previewParams) {
            // Params were passed directly via init config (server-side SSR path).
            previewDocument = PreviewDocument.createFromParams(this.previewParams);
        } else if (environment.isClient()) {
            previewDocument = PreviewDocument.createFromWindow();
        } else {
            previewDocument = await PreviewDocument.createFromHeaders();
        }

        if (!previewDocument.matches({ type: "page", path })) {
            return this.liveSdk.getPage(path);
        }
        return this.dataProvider.getPageById(previewDocument.getId());
    }

    async listPages(options?: ListPagesOptions): Promise<ListPagesResult> {
        return this.liveSdk.listPages(options);
    }
}
