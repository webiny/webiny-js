import { TranslatePageUseCase as UseCaseAbstraction, TranslatePageRepository } from "./abstractions.js";
import type { Page } from "~/domain/Page/index.js";

class TranslatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: TranslatePageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Page> {
        return await this.repository.execute({
            pageId: params.id,
            languageCode: params.languageCode,
            folderId: params.folderId
        });
    }
}

export const TranslatePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: TranslatePageUseCaseImpl,
    dependencies: [TranslatePageRepository]
});
