import { createAbstraction } from "@webiny/feature/api";
import type { IDataLoadersHandler } from "~/types.js";

export const CmsDdbEsDataLoaders = createAbstraction<IDataLoadersHandler>("Cms/DdbEs/DataLoaders");

export namespace CmsDdbEsDataLoaders {
    export type Interface = IDataLoadersHandler;
}
