import { createAbstraction } from "@webiny/feature/api";
import type { Operations } from "../Operations/abstraction.js";

export interface IOperationsBuilderBuildParams<TRecord = unknown> {
    records: TRecord[];
}

export interface IOperationsBuilder<TRecord = unknown> {
    build(params: IOperationsBuilderBuildParams<TRecord>): Promise<Operations.Interface>;
}

export const OperationsBuilder = createAbstraction<IOperationsBuilder>("Sync/OperationsBuilder");

export namespace OperationsBuilder {
    export type Interface<TRecord = unknown> = IOperationsBuilder<TRecord>;
}
