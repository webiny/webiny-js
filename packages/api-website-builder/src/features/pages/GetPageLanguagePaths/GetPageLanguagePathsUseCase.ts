import { Result } from "@webiny/feature/api";
import {
    GetPageLanguagePathsUseCase as UseCaseAbstraction,
    GetPageLanguagePathsRepository
} from "./abstractions.js";

class GetPageLanguagePathsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetPageLanguagePathsRepository.Interface) {}

    async execute(rootEntryId: string): UseCaseAbstraction.Return {
        const result = await this.repository.execute(rootEntryId);

        if (result.isFail()) {
            return result;
        }

        return Result.ok(result.value);
    }
}

export const GetPageLanguagePathsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageLanguagePathsUseCaseImpl,
    dependencies: [GetPageLanguagePathsRepository]
});
