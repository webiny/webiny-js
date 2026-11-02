import { createAbstraction } from "@webiny/feature/admin";
import type { AiTool } from "~/editor/domain/types.js";

/*
 * Lists the tools an AI step may use. Called only with the AI editor (R275). Throws a
 * `GraphQLOperationError` for a server error and the transport `Error` as is.
 */
export interface IListAiToolsUseCase {
    execute(): Promise<AiTool[]>;
}

export const ListAiToolsUseCase = createAbstraction<IListAiToolsUseCase>(
    "Workflows/ListAiToolsUseCase"
);

export namespace ListAiToolsUseCase {
    export type Interface = IListAiToolsUseCase;
}
