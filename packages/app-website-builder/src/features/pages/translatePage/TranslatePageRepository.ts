import { TranslatePageRepository as RepositoryAbstraction, TranslatePageGateway } from "./abstractions.js";
import { Page, pageListCache } from "~/domain/Page/index.js";

class TranslatePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: TranslatePageGateway.Interface) {}

    async execute(params: RepositoryAbstraction.Interface["execute"] extends (p: infer P) => any ? P : never): Promise<Page> {
        const result = await this.gateway.execute({
            pageId: params.pageId,
            languageCode: params.languageCode,
            folderId: params.folderId
        });
        
        const page = Page.create(result);
        
        // Add translated page to cache
        pageListCache.addItems([page]);
        
        return page;
    }
}

export const TranslatePageRepository = RepositoryAbstraction.createImplementation({
    implementation: TranslatePageRepositoryImpl,
    dependencies: [TranslatePageGateway]
});
