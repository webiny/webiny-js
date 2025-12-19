import { GetPageByIdUseCase as UseCaseAbstraction, GetPageByIdRepository } from "./abstractions.js";

class GetPageByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetPageByIdRepository.Interface) {}

    async execute(id: string): UseCaseAbstraction.Return {
        return this.repository.execute(id);
    }
}

export const GetPageByIdUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageByIdUseCaseImpl,
    dependencies: [GetPageByIdRepository]
});
