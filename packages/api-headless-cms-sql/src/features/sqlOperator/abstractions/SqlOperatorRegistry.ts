import { createAbstraction } from "@webiny/feature/api/index.js";
import type { SqlOperator } from "./SqlOperator.js";

export interface ISqlOperatorRegistry {
    get(operator: string): SqlOperator.Interface;
}

export const SqlOperatorRegistry = createAbstraction<ISqlOperatorRegistry>(
    "Cms/Sql/OperatorRegistry"
);

export namespace SqlOperatorRegistry {
    export type Interface = ISqlOperatorRegistry;
}
