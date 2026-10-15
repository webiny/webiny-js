import { createAbstraction } from "@webiny/feature/admin";
import type { DashboardLayoutData } from "../types.js";

/**
 * Talks to the API. `get` resolves to `null` when the user never customized their dashboard.
 */
export interface IDashboardLayoutGateway {
    get(): Promise<DashboardLayoutData | null>;
    save(layout: DashboardLayoutData): Promise<DashboardLayoutData>;
}

export const DashboardLayoutGateway =
    createAbstraction<IDashboardLayoutGateway>("DashboardLayoutGateway");

export namespace DashboardLayoutGateway {
    export type Interface = IDashboardLayoutGateway;
}

/**
 * Keeps a copy of each user's layout in localStorage, so the dashboard renders straight away and
 * the API request only confirms or corrects it.
 */
export interface IDashboardLayoutRepository {
    // The cached layout, or `null` if there is none for this user and tenant.
    getCached(userId: string): DashboardLayoutData | null;
    // Fetches the stored layout and refreshes the cache with it.
    fetch(userId: string): Promise<DashboardLayoutData | null>;
    save(userId: string, layout: DashboardLayoutData): Promise<void>;
}

export const DashboardLayoutRepository = createAbstraction<IDashboardLayoutRepository>(
    "DashboardLayoutRepository"
);

export namespace DashboardLayoutRepository {
    export type Interface = IDashboardLayoutRepository;
}
