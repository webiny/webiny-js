import {
    GetPageByPathUseCase as UseCaseAbstraction,
    GetPageByPathRepository
} from "./abstractions.js";

class GetPageByPathUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetPageByPathRepository.Interface) {}

    async execute(path: string): UseCaseAbstraction.Return {
        return this.repository.execute(path);
    }
}

export const GetPageByPathUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageByPathUseCaseImpl,
    dependencies: [GetPageByPathRepository]
});
