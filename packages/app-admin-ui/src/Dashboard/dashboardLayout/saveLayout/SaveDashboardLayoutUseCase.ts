import {
    SaveDashboardLayoutGateway,
    SaveDashboardLayoutUseCase as UseCaseAbstraction
} from "./abstractions.js";
import type { DashboardLayoutData } from "../types.js";

class SaveDashboardLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: SaveDashboardLayoutGateway.Interface) {}

    async execute(layout: DashboardLayoutData): Promise<void> {
        await this.gateway.execute(layout);
    }
}

export const SaveDashboardLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: SaveDashboardLayoutUseCaseImpl,
    dependencies: [SaveDashboardLayoutGateway]
});
