import { DashboardLayoutRepository } from "../repository/abstractions.js";
import { GetCachedDashboardLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { DashboardLayoutData } from "../types.js";

class GetCachedDashboardLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DashboardLayoutRepository.Interface) {}

    execute(userId: string): DashboardLayoutData | null {
        return this.repository.getCached(userId);
    }
}

export const GetCachedDashboardLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetCachedDashboardLayoutUseCaseImpl,
    dependencies: [DashboardLayoutRepository]
});
