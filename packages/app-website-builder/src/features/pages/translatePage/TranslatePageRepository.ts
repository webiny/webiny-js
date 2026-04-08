import {
    TranslatePageRepository as RepositoryAbstraction,
    TranslatePageGateway
} from "./abstractions.js";

class TranslatePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: TranslatePageGateway.Interface) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        return this.gateway.execute({
            pageId: params.pageId,
            languageCode: params.languageCode,
            folderId: params.folderId
        });
    }
}

export const TranslatePageRepository = RepositoryAbstraction.createImplementation({
    implementation: TranslatePageRepositoryImpl,
    dependencies: [TranslatePageGateway]
});
