import {
    TranslatePageUseCase as UseCaseAbstraction,
    TranslatePageRepository,
    type TranslatedPageDto
} from "./abstractions.js";

class TranslatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: TranslatePageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<TranslatedPageDto> {
        return this.repository.execute({
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
