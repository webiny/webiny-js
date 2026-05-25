import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IModelSchemaManager {
    ensure(tableName: string): Promise<void>;
}

export const ModelSchemaManagerAbstraction = createAbstraction<IModelSchemaManager>(
    "Cms/Sql/ModelSchemaManager"
);

export namespace ModelSchemaManagerAbstraction {
    export type Interface = IModelSchemaManager;
}
