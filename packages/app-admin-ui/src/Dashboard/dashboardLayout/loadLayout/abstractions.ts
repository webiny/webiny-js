import { createAbstraction } from "@webiny/feature/admin";
import type { DashboardLayoutData } from "../types.js";

// Returns the cached layout without a request, so the dashboard can render it straight away.
export interface IGetCachedDashboardLayoutUseCase {
    execute(userId: string): DashboardLayoutData | null;
}

export const GetCachedDashboardLayoutUseCase = createAbstraction<IGetCachedDashboardLayoutUseCase>(
    "GetCachedDashboardLayoutUseCase"
);

export namespace GetCachedDashboardLayoutUseCase {
    export type Interface = IGetCachedDashboardLayoutUseCase;
}

// Fetches the stored layout from the API. `null` means the user never customized their dashboard.
export interface IFetchDashboardLayoutUseCase {
    execute(userId: string): Promise<DashboardLayoutData | null>;
}

export const FetchDashboardLayoutUseCase = createAbstraction<IFetchDashboardLayoutUseCase>(
    "FetchDashboardLayoutUseCase"
);

export namespace FetchDashboardLayoutUseCase {
    export type Interface = IFetchDashboardLayoutUseCase;
}
