import { CreateEntryUseCase as UseCaseAbstraction, CreateEntryRepository } from "./abstractions.js";
import type { ICreateEntryGatewayParams } from "./abstractions.js";

class CreateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateEntryRepository.Interface) {}

    async execute(params: ICreateEntryGatewayParams) {
        return this.repository.execute(params);
    }
}

export const CreateEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateEntryUseCaseImpl,
    dependencies: [CreateEntryRepository]
});
