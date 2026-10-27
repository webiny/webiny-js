import { createAbstraction } from "@webiny/feature/admin";
import type { AutomationDefinition } from "~/editor/domain/types.js";

/*
 * Lists the automation definitions an automation step can run. Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is.
 */
export interface IListAutomationDefinitionsUseCase {
    execute(): Promise<AutomationDefinition[]>;
}

export const ListAutomationDefinitionsUseCase =
    createAbstraction<IListAutomationDefinitionsUseCase>(
        "Workflows/ListAutomationDefinitionsUseCase"
    );

export namespace ListAutomationDefinitionsUseCase {
    export type Interface = IListAutomationDefinitionsUseCase;
}
