import { createAbstraction } from "@webiny/feature/api";

export interface IPrivateTaskDefinitions {
    /** The ids of the registered private task definitions. */
    getIds(): string[];
    /** A definition that is not registered is not private. */
    isPrivate(definitionId: string): boolean;
}

/**
 * The private task definitions (R180). A private definition is an internal contract between the
 * code that registers it and the code that triggers it through `TaskService`; its tasks are hidden
 * from the GraphQL API.
 */
export const PrivateTaskDefinitions = createAbstraction<IPrivateTaskDefinitions>(
    "Tasks/PrivateTaskDefinitions"
);

export namespace PrivateTaskDefinitions {
    export type Interface = IPrivateTaskDefinitions;
}
