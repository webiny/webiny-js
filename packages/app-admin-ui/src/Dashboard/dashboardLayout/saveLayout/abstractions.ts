import { createAbstraction } from "@webiny/feature/admin";
import type { DashboardLayoutData } from "../types.js";

export interface ISaveDashboardLayoutUseCase {
    execute(userId: string, layout: DashboardLayoutData): Promise<void>;
}

export const SaveDashboardLayoutUseCase = createAbstraction<ISaveDashboardLayoutUseCase>(
    "SaveDashboardLayoutUseCase"
);

export namespace SaveDashboardLayoutUseCase {
    export type Interface = ISaveDashboardLayoutUseCase;
}
