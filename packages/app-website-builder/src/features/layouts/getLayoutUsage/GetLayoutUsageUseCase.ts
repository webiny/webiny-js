import { LayoutsRepository } from "../shared/abstractions.js";
import { GetLayoutUsageUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetLayoutUsageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(id: string) {
        return this.repository.getUsage(id);
    }
}

export const GetLayoutUsageUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutUsageUseCaseImpl,
    dependencies: [LayoutsRepository]
});
