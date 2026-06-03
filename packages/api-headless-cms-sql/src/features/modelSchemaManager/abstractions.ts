import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IModelSchemaManager {
    ensure(tableName: string): Promise<void>;
    reset(): void;
}

export const ModelSchemaManager = createAbstraction<IModelSchemaManager>(
    "Cms/Sql/ModelSchemaManager"
);

export namespace ModelSchemaManager {
    export type Interface = IModelSchemaManager;
}
