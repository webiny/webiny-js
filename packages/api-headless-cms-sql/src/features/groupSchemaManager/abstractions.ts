import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IGroupSchemaManager {
    ensure(tableName: string): Promise<void>;
}

export const GroupSchemaManagerAbstraction = createAbstraction<IGroupSchemaManager>(
    "Cms/Sql/GroupSchemaManager"
);

export namespace GroupSchemaManagerAbstraction {
    export type Interface = IGroupSchemaManager;
}
