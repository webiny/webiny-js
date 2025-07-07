import type { GetPageOptions, IDataProvider, Page } from "~/sdk/types.js";
import mockPage1 from "~/sdk/mocks/mockPage1";
import emptyPage from "~/sdk/mocks/emptyPage";
import previewPage1 from "~/sdk/mocks/previewPage1";

interface DefaultDataProviderConfig {
    apiKey: string;
    apiEndpoint?: string;
}

export class DefaultDataProvider implements IDataProvider {
    private config: DefaultDataProviderConfig;

    constructor(config: DefaultDataProviderConfig) {
        this.config = config;
    }

    public async getPage(path: string, options: GetPageOptions = {}): Promise<Page | null> {
        const { preview = false } = options;

        // const res = await fetch(`${this.apiEndpoint}?url=${encodeURIComponent(path)}&preview=${isServerPreview ? "1" : "0"}`);
        return preview ? previewPage1 : mockPage1;
        // return path === "/page-1" ? mockPage1 : emptyPage;
    }

    public async listPages() {
        return [mockPage1, emptyPage];
    }
}
