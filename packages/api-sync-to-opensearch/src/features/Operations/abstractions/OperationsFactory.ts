import { createAbstraction } from "@webiny/feature/api";
import type { Operations } from "./Operations.js";

export interface IOperationsFactory {
    create(): Operations.Interface;
}

export const OperationsFactory = createAbstraction<IOperationsFactory>("Sync/OperationsFactory");

export namespace OperationsFactory {
    export type Interface = IOperationsFactory;
}
