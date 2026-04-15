import { GetPageUseCase as UseCaseAbstraction, GetPageRepository } from "./abstractions.js";

class GetPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetPageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        return await this.repository.execute(params.id);
    }
}

export const GetPageUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageUseCaseImpl,
    dependencies: [GetPageRepository]
});
