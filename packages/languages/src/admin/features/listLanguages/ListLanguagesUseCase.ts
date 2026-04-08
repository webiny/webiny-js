import { ListLanguagesUseCase as UseCaseAbstraction, ListLanguagesRepository, LanguageDto } from "./abstractions.js";

class ListLanguagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListLanguagesRepository.Interface) {}

    async execute(): Promise<LanguageDto[]> {
        return await this.repository.execute();
    }
}

export const ListLanguagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListLanguagesUseCaseImpl,
    dependencies: [ListLanguagesRepository]
});
