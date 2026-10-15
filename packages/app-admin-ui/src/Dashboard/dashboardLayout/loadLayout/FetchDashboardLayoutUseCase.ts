import { DashboardLayoutRepository } from "../repository/abstractions.js";
import { FetchDashboardLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { DashboardLayoutData } from "../types.js";

class FetchDashboardLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DashboardLayoutRepository.Interface) {}

    async execute(userId: string): Promise<DashboardLayoutData | null> {
        return await this.repository.fetch(userId);
    }
}

export const FetchDashboardLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: FetchDashboardLayoutUseCaseImpl,
    dependencies: [DashboardLayoutRepository]
});
