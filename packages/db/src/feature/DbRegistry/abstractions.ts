import { createAbstraction } from "@webiny/feature/api";
import type { IRegistry } from "~/types.js";

export const DbRegistry = createAbstraction<IRegistry>("Db/DbRegistry");

export namespace DbRegistry {
    export type Interface = IRegistry;
}
