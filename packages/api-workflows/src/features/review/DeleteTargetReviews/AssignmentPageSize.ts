import { createAbstraction } from "@webiny/feature/api";

export interface IAssignmentPageSize {
    /** How many assignment records are listed per page while deleting a review's records. */
    value: number;
}

/** Tunable page size; tests register a smaller one to force several pages. */
export const AssignmentPageSize = createAbstraction<IAssignmentPageSize>("AssignmentPageSize");

export namespace AssignmentPageSize {
    export type Interface = IAssignmentPageSize;
}
