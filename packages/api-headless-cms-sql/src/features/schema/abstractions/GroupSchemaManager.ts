import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IGroupSchemaManager {
    ensure(tableName: string): Promise<void>;
}

export const GroupSchemaManager = createAbstraction<IGroupSchemaManager>(
    "Cms/Sql/GroupSchemaManager"
);

export namespace GroupSchemaManager {
    export type Interface = IGroupSchemaManager;
}
