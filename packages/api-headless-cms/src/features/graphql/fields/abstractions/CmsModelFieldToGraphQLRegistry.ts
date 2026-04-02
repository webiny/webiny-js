import { createAbstraction } from "@webiny/feature/api";
import type { CmsModelFieldType } from "~/types/modelField.js";
import type { CmsModelFieldToGraphQL } from "./CmsModelFieldToGraphQL.js";
import type { CmsModelFieldToGraphQLPlugin } from "~/types/index.js";

export interface ICmsModelFieldToGraphQLRegistry {
    get(fieldType: CmsModelFieldType): CmsModelFieldToGraphQL.Interface | undefined;
    getAll(): CmsModelFieldToGraphQL.Interface[];
    getAllAsPlugins(): CmsModelFieldToGraphQLPlugin[];
    getAllAsPluginRecords(): Record<string, CmsModelFieldToGraphQLPlugin>;
}

export const CmsModelFieldToGraphQLRegistry = createAbstraction<ICmsModelFieldToGraphQLRegistry>(
    "Cms/Model/Field/ToGraphQL/Registry"
);

export namespace CmsModelFieldToGraphQLRegistry {
    export type Interface = ICmsModelFieldToGraphQLRegistry;
}
