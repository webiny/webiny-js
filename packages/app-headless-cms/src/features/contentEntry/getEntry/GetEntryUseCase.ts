import { GetEntryUseCase as UseCaseAbstraction, GetEntryRepository } from "./abstractions.js";
import type { IGetEntryParams } from "./abstractions.js";

class GetEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetEntryRepository.Interface) {}

    async execute(params: IGetEntryParams) {
        return this.repository.execute(params);
    }
}

export const GetEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetEntryUseCaseImpl,
    dependencies: [GetEntryRepository]
});
