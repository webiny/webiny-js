import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

/**
 * DashboardModelProvider - Fetches the private CMS model that stores dashboard layouts.
 */
export interface IDashboardModelProvider {
    get(): Promise<CmsModel>;
}

export const DashboardModelProvider =
    createAbstraction<IDashboardModelProvider>("DashboardModelProvider");

export namespace DashboardModelProvider {
    export type Interface = IDashboardModelProvider;
}
