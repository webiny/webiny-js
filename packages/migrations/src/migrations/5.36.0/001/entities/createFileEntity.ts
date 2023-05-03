import { Table } from "dynamodb-toolbox";
import { createStandardEntity } from "~/utils";

export const createFileEntity = (table: Table) => {
    return createStandardEntity(table, "FM.File");
};
