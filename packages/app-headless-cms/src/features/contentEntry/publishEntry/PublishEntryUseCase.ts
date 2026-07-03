import {
    PublishEntryUseCase as UseCaseAbstraction,
    PublishEntryRepository
} from "./abstractions.js";
import type { IPublishEntryParams } from "./abstractions.js";

class PublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: PublishEntryRepository.Interface) {}

    async execute(params: IPublishEntryParams) {
        return this.repository.execute(params);
    }
}

export const PublishEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: PublishEntryUseCaseImpl,
    dependencies: [PublishEntryRepository]
});
