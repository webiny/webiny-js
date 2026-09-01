import {
    RestoreFromTrashUseCase as UseCaseAbstraction,
    RestoreFromTrashRepository
} from "./abstractions.js";
import type { IRestoreFromTrashParams } from "./abstractions.js";

class RestoreFromTrashUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: RestoreFromTrashRepository.Interface) {}

    async execute(params: IRestoreFromTrashParams) {
        return this.repository.execute(params);
    }
}

export const RestoreFromTrashUseCase = UseCaseAbstraction.createImplementation({
    implementation: RestoreFromTrashUseCaseImpl,
    dependencies: [RestoreFromTrashRepository]
});
