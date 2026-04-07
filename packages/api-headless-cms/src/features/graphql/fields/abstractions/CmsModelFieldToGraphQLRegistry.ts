import { createAbstraction } from "@webiny/feature/api";
import type { CmsModelFieldType } from "~/types/modelField.js";
import type { CmsModelFieldToGraphQL } from "./CmsModelFieldToGraphQL.js";

export interface ICmsModelFieldToGraphQLRegistry {
    get(fieldType: CmsModelFieldType): CmsModelFieldToGraphQL.Interface | undefined;
    getAll(): CmsModelFieldToGraphQL.Interface[];
}

export const CmsModelFieldToGraphQLRegistry = createAbstraction<ICmsModelFieldToGraphQLRegistry>(
    "Cms/GraphQL/Schema/ModelFieldRegistry"
);

export namespace CmsModelFieldToGraphQLRegistry {
    export type Interface = ICmsModelFieldToGraphQLRegistry;
}
