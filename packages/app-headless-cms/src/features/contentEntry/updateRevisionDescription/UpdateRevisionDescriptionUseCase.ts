import {
    UpdateRevisionDescriptionUseCase as UseCaseAbstraction,
    UpdateRevisionDescriptionRepository
} from "./abstractions.js";
import type { IUpdateRevisionDescriptionParams } from "./abstractions.js";

class UpdateRevisionDescriptionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateRevisionDescriptionRepository.Interface) {}

    async execute(params: IUpdateRevisionDescriptionParams) {
        return this.repository.execute(params);
    }
}

export const UpdateRevisionDescriptionUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateRevisionDescriptionUseCaseImpl,
    dependencies: [UpdateRevisionDescriptionRepository]
});
