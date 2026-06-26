import { GetModelUseCase as UseCaseAbstraction, GetModelRepository } from "./abstractions.js";
import type { IGetModelParams } from "./abstractions.js";

class GetModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetModelRepository.Interface) {}

    async execute(params: IGetModelParams) {
        return this.repository.execute(params);
    }
}

export const GetModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetModelUseCaseImpl,
    dependencies: [GetModelRepository]
});
