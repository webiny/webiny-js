import { Table } from "dynamodb-toolbox";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { createFormEntity } from "../entities/createFormEntity";
import { batchWriteAll, BatchWriteItem, scan } from "~/utils";
import { FbForm } from "../types";
import { inject, makeInjectable } from "@webiny/ioc";

export class MultiStepForms_5_38_0_001 implements DataMigration {
    private readonly formEntity: ReturnType<typeof createFormEntity>;

    constructor(table: Table) {
        this.formEntity = createFormEntity(table);
    }

    getId() {
        return "5.38.0-001";
    }

    getDescription() {
        return "Convert forms tu multi-step forms.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const result = await scan<FbForm>({
            entity: this.formEntity,
            options: {
                filters: [
                    {
                        attr: "TYPE",
                        beginsWith: "fb.form"
                    }
                ]
            }
        });

        for (let i = 0; i < result.items.length; i++) {
            const current = result.items[i];
            if (!current.steps) {
                return true;
            }
        }

        logger.info(`Form entries already upgraded. skipping...`);
        return false;
    }

    async execute({ logger }: DataMigrationContext): Promise<void> {
        const result = await scan<FbForm>({
            entity: this.formEntity,
            options: {
                filters: [
                    {
                        attr: "TYPE",
                        beginsWith: "fb.form"
                    }
                ]
            }
        });

        const items: BatchWriteItem[] = [];

        for (let i = 0; i < result.items.length; i++) {
            const current = result.items[i];
            if (!current.steps) {
                // If no steps are defined, we need to create a single step.
                current.steps = [];

                if (Array.isArray(current.layout)) {
                    // If layout is an array, we need to create a single step with all the fields.
                    current.steps = [{ title: "Step 1", layout: current.layout || [] }];
                    delete current.layout;

                    items.push(this.formEntity.putBatch(current));
                }
            }
        }

        logger.info(`Updating total of ${items.length} forms.`);

        await batchWriteAll({
            table: this.formEntity.table,
            items
        });

        logger.info("Updated all the forms.");
    }
}

makeInjectable(MultiStepForms_5_38_0_001, [inject(PrimaryDynamoTableSymbol)]);
