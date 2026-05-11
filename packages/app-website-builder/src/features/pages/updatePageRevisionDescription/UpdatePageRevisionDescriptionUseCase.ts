import {
    UpdatePageRevisionDescriptionRepository,
    UpdatePageRevisionDescriptionUseCase as UseCaseAbstraction
} from "./abstractions.js";

class UpdatePageRevisionDescriptionUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly repository: UpdatePageRevisionDescriptionRepository.Interface
    ) {}

    public async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(params.id, params.revisionDescription);
    }
}

export const UpdatePageRevisionDescriptionUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdatePageRevisionDescriptionUseCaseImpl,
    dependencies: [UpdatePageRevisionDescriptionRepository]
});
