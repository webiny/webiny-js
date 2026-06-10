import { createAbstraction } from "@webiny/feature/admin";
import type { TaskDefinition } from "~/admin/shared/types.js";

export interface IListDefinitionsGateway {
    execute(): Promise<TaskDefinition[]>;
}

export const ListDefinitionsGateway =
    createAbstraction<IListDefinitionsGateway>("ListDefinitionsGateway");

export namespace ListDefinitionsGateway {
    export type Interface = IListDefinitionsGateway;
}

export interface IListDefinitionsUseCase {
    execute(): Promise<TaskDefinition[]>;
}

export const ListDefinitionsUseCase =
    createAbstraction<IListDefinitionsUseCase>("ListDefinitionsUseCase");

export namespace ListDefinitionsUseCase {
    export type Interface = IListDefinitionsUseCase;
}
