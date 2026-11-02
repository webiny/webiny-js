import { createAbstraction } from "@webiny/feature/admin";
import type { EditorStepType } from "~/editor/domain/types.js";

/*
 * Lists the step types the editor offers, in the server's order. Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is.
 */
export interface IListStepTypesUseCase {
    execute(): Promise<EditorStepType[]>;
}

export const ListStepTypesUseCase = createAbstraction<IListStepTypesUseCase>(
    "Workflows/ListStepTypesUseCase"
);

export namespace ListStepTypesUseCase {
    export type Interface = IListStepTypesUseCase;
}
