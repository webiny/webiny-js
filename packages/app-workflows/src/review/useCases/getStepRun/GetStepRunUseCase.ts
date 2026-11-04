import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetStepRunUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetStepRunUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<ReviewStepRunInfo | null> {
        return this.repository.getStepRun(params);
    }
}

export const GetStepRunUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetStepRunUseCaseImpl,
    dependencies: [ReviewRepository]
});
