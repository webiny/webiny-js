import { SqlSchemaSetup } from "@webiny/api-core-sql";
import { FolderCatalogSchema } from "./FolderCatalogSchema.js";

/** The `aco` schema setup step: the folder catalog's tables. */
class AcoPgSchemaSetupImpl implements SqlSchemaSetup.Interface {
    public readonly name = "aco";

    public constructor(private readonly catalogSchema: FolderCatalogSchema.Interface) {}

    public setup(): Promise<void> {
        return this.catalogSchema.setup();
    }
}

export const AcoPgSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: AcoPgSchemaSetupImpl,
    dependencies: [FolderCatalogSchema]
});
