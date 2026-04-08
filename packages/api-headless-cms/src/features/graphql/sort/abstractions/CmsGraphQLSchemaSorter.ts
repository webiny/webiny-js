import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

export interface ICmsGraphQLSchemaSorterParams {
    model: CmsModel;
    sorters: string[];
}

export interface ICmsGraphQLSchemaSorter {
    execute(params: ICmsGraphQLSchemaSorterParams): string[];
}

export const CmsGraphQLSchemaSorter = createAbstraction<ICmsGraphQLSchemaSorter>(
    "Cms/GraphQL/Schema/Sorter"
);

export namespace CmsGraphQLSchemaSorter {
    export type Interface = ICmsGraphQLSchemaSorter;
    export type Params = ICmsGraphQLSchemaSorterParams;
}
