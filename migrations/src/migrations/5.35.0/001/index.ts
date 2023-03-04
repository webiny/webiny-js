import { Table, Entity } from "dynamodb-toolbox";
import { DataMigration, Logger, PrimaryDynamoTableSymbol } from "@webiny/data-migration";
import { makeInjectable, inject } from "@webiny/ioc";
import { createStandardEntity } from "~/utils";

export class FileManager_5_35_0_001 implements DataMigration {
    private readonly newFileEntity: Entity<any>;

    constructor(table: Table) {
        this.newFileEntity = createStandardEntity(table, "File");
    }

    getId(): string {
        return "5.35.0-001";
    }

    getName(): string {
        return "Migrate partition key to use file ID as part of the PK";
    }

    shouldExecute(): Promise<boolean> {
        return Promise.resolve(true);
    }

    async execute(logger: Logger): Promise<void> {
        await this.newFileEntity.put({
            PK: "T#root#FM#FILE#1",
            SK: "A",
            TYPE: "fm.file",
            GSI1_PK: "T#root#FM#FILES",
            GSI1_SK: "1",
            data: {}
        });
    }
}

makeInjectable(FileManager_5_35_0_001, [inject(PrimaryDynamoTableSymbol)]);
