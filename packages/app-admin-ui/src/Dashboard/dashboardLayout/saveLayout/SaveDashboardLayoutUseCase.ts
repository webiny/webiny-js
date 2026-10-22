import { DashboardLayoutRepository } from "../repository/abstractions.js";
import { SaveDashboardLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { DashboardLayoutData } from "../types.js";

class SaveDashboardLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DashboardLayoutRepository.Interface) {}

    async execute(userId: string, layout: DashboardLayoutData): Promise<void> {
        await this.repository.save(userId, layout);
    }
}

export const SaveDashboardLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: SaveDashboardLayoutUseCaseImpl,
    dependencies: [DashboardLayoutRepository]
});
