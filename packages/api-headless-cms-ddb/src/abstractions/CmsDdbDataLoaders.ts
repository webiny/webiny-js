import { createAbstraction } from "@webiny/feature/api";
import type { IDataLoadersHandler } from "~/types.js";

export const CmsDdbDataLoaders = createAbstraction<IDataLoadersHandler>("Cms/Ddb/DataLoaders");

export namespace CmsDdbDataLoaders {
    export type Interface = IDataLoadersHandler;
}
