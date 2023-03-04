import { FileManager_5_35_0_001 } from "./migrations/5.35.0/001";
import { DataMigration } from "@webiny/data-migration";
import { Constructor } from "@webiny/ioc";

export const migrations = (): Constructor<DataMigration>[] => {
    return [FileManager_5_35_0_001];
};
