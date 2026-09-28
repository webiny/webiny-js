import { createAbstraction } from "@webiny/feature/admin";
import type { DashboardLayoutData } from "../types.js";

export interface ISaveDashboardLayoutGateway {
    execute(layout: DashboardLayoutData): Promise<DashboardLayoutData>;
}

export const SaveDashboardLayoutGateway = createAbstraction<ISaveDashboardLayoutGateway>(
    "SaveDashboardLayoutGateway"
);

export namespace SaveDashboardLayoutGateway {
    export type Interface = ISaveDashboardLayoutGateway;
}

export interface ISaveDashboardLayoutUseCase {
    execute(layout: DashboardLayoutData): Promise<void>;
}

export const SaveDashboardLayoutUseCase = createAbstraction<ISaveDashboardLayoutUseCase>(
    "SaveDashboardLayoutUseCase"
);

export namespace SaveDashboardLayoutUseCase {
    export type Interface = ISaveDashboardLayoutUseCase;
}
