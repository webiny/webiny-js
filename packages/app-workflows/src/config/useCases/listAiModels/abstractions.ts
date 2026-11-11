import { createAbstraction } from "@webiny/feature/admin";
import type { AiModel } from "~/editor/domain/types.js";

/*
 * Lists the AI models of the AI Power-Ups extension. Call it only when the AI step type is
 * available and has a config schema: the field exists only with the extension (R275). Throws a
 * `GraphQLOperationError` for a server error and the transport `Error` as is.
 */
export interface IListAiModelsUseCase {
    execute(): Promise<AiModel[]>;
}

export const ListAiModelsUseCase = createAbstraction<IListAiModelsUseCase>(
    "Workflows/ListAiModelsUseCase"
);

export namespace ListAiModelsUseCase {
    export type Interface = IListAiModelsUseCase;
}
