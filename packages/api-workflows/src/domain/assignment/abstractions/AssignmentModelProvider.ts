import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IAssignmentModelProvider {
    get(): Promise<CmsModel>;
}

/** Provides the tenant's `wbyWorkflowAssignment` model on demand. */
export const AssignmentModelProvider =
    createAbstraction<IAssignmentModelProvider>("AssignmentModelProvider");

export namespace AssignmentModelProvider {
    export type Interface = IAssignmentModelProvider;
}
