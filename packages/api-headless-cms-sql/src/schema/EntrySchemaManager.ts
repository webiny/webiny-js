import type { Knex } from "knex";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { IStoredTableSchema } from "./abstractions/index.js";
import { EntrySchemaManager } from "./abstractions/index.js";
import { FieldTypeMapper } from "./abstractions/index.js";
import { SchemaRegistry } from "./abstractions/index.js";
import { KnexInstance } from "./abstractions/index.js";
import { addColumn } from "./columnBuilder.js";

const SCHEMAS_TABLE = "cms_table_schemas";

class EntrySchemaManagerImpl implements EntrySchemaManager.Interface {
    private readonly knex: KnexInstance.Interface;
    private readonly fieldTypeMapper: FieldTypeMapper.Interface;
    private readonly registry: SchemaRegistry.Interface;
    private schemasTableReady: boolean = false;

    constructor(
        knex: KnexInstance.Interface,
        fieldTypeMapper: FieldTypeMapper.Interface,
        registry: SchemaRegistry.Interface
    ) {
        this.knex = knex;
        this.fieldTypeMapper = fieldTypeMapper;
        this.registry = registry;
    }

    public async sync(tableName: string, modelId: string, fields: CmsModelField[]): Promise<void> {
        await this.ensureSchemasTable();

        const storedSchema = await this.getStoredSchema(tableName);
        const tableExists = await this.knex.schema.hasTable(tableName);

        if (!tableExists) {
            await this.createEntryTable(tableName, fields);
            await this.storeSchema(tableName, modelId, fields);
            this.registry.markVerified(tableName);

            return;
        }

        if (this.registry.isVerified(tableName) && storedSchema) {
            return;
        }

        const storedFields = storedSchema
            ? (JSON.parse(storedSchema.fields) as CmsModelField[])
            : [];

        const storedStorageIds = new Set(storedFields.map(f => f.storageId));

        const newFields = fields.filter(f => !storedStorageIds.has(f.storageId));

        if (newFields.length > 0) {
            await this.knex.schema.alterTable(tableName, table => {
                for (const field of newFields) {
                    const columnType = this.fieldTypeMapper.mapFieldType(
                        field.type,
                        field.settings
                    );

                    addColumn(table, field.storageId, columnType, true);
                }
            });
        }

        await this.storeSchema(tableName, modelId, fields);
        this.registry.markVerified(tableName);
    }

    public async drop(tableName: string): Promise<void> {
        await this.knex.schema.dropTableIfExists(tableName);

        await this.ensureSchemasTable();

        await this.knex(SCHEMAS_TABLE).where("tableName", tableName).delete();

        this.registry.removeVerified(tableName);
    }

    private async createEntryTable(tableName: string, fields: CmsModelField[]): Promise<void> {
        await this.knex.schema.createTable(tableName, table => {
            this.applyEntryMetaColumns(table);

            for (const field of fields) {
                const columnType = this.fieldTypeMapper.mapFieldType(field.type, field.settings);

                addColumn(table, field.storageId, columnType, true);
            }
        });
    }

    private async ensureSchemasTable(): Promise<void> {
        if (this.schemasTableReady) {
            return;
        }

        const exists = await this.knex.schema.hasTable(SCHEMAS_TABLE);

        if (!exists) {
            await this.knex.schema.createTable(SCHEMAS_TABLE, table => {
                table.string("tableName").primary();
                table.string("modelId").notNullable();
                table.text("fields").notNullable();
                table.string("syncedOn").notNullable();
            });
        }

        this.schemasTableReady = true;
    }

    private async getStoredSchema(tableName: string): Promise<IStoredTableSchema | null> {
        const row = await this.knex<IStoredTableSchema>(SCHEMAS_TABLE)
            .where("tableName", tableName)
            .first();

        return row ?? null;
    }

    private async storeSchema(
        tableName: string,
        modelId: string,
        fields: CmsModelField[]
    ): Promise<void> {
        const data: IStoredTableSchema = {
            tableName,
            modelId,
            fields: JSON.stringify(fields),
            syncedOn: new Date().toISOString()
        };

        const existing = await this.getStoredSchema(tableName);

        if (existing) {
            await this.knex(SCHEMAS_TABLE).where("tableName", tableName).update(data);
        } else {
            await this.knex(SCHEMAS_TABLE).insert(data);
        }
    }

    private applyEntryMetaColumns(table: Knex.CreateTableBuilder): void {
        table.string("id").primary();
        table.string("entryId").notNullable().index();
        table.integer("version").notNullable();
        table.string("status").notNullable();
        table.boolean("locked").notNullable().defaultTo(false);

        table.string("revisionCreatedOn");
        table.string("revisionModifiedOn");
        table.string("revisionSavedOn");
        table.string("revisionDeletedOn");
        table.string("revisionRestoredOn");
        table.string("revisionFirstPublishedOn");
        table.string("revisionLastPublishedOn");

        table.string("revisionCreatedBy_id");
        table.string("revisionCreatedBy_displayName");
        table.string("revisionCreatedBy_type");
        table.text("revisionCreatedBy");

        table.string("revisionModifiedBy_id");
        table.text("revisionModifiedBy");

        table.string("revisionSavedBy_id");
        table.text("revisionSavedBy");

        table.string("createdOn");
        table.string("modifiedOn");
        table.string("savedOn");
        table.string("deletedOn");
        table.string("restoredOn");
        table.string("firstPublishedOn");
        table.string("lastPublishedOn");

        table.string("createdBy_id");
        table.string("createdBy_displayName");
        table.string("createdBy_type");
        table.text("createdBy");

        table.string("modifiedBy_id");
        table.text("modifiedBy");

        table.string("savedBy_id");
        table.text("savedBy");

        table.text("location");
        table.boolean("wbyDeleted").defaultTo(false);
        table.string("binOriginalFolderId");
        table.text("meta");
        table.text("system");
        table.text("live");
        table.string("revisionDescription");
        table.bigInteger("expiresAt");
    }
}

export const EntrySchemaManagerImplementation = EntrySchemaManager.createImplementation({
    implementation: EntrySchemaManagerImpl,
    dependencies: [KnexInstance, FieldTypeMapper, SchemaRegistry]
});
