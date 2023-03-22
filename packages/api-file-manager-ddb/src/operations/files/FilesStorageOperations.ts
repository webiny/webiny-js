import {
    File,
    FileAlias,
    FileManagerFilesStorageOperations,
    FileManagerFilesStorageOperationsCreateBatchParams,
    FileManagerFilesStorageOperationsCreateParams,
    FileManagerFilesStorageOperationsDeleteParams,
    FileManagerFilesStorageOperationsGetParams,
    FileManagerFilesStorageOperationsListParams,
    FileManagerFilesStorageOperationsListParamsWhere,
    FileManagerFilesStorageOperationsListResponse,
    FileManagerFilesStorageOperationsListResponseMeta,
    FileManagerFilesStorageOperationsTagsParams,
    FileManagerFilesStorageOperationsTagsParamsWhere,
    FileManagerFilesStorageOperationsTagsResponse,
    FileManagerFilesStorageOperationsUpdateParams
} from "@webiny/api-file-manager/types";
import { Entity, Table } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import { createTable } from "~/definitions/table";
import { queryOptions as DynamoDBToolboxQueryOptions } from "dynamodb-toolbox/dist/classes/Table";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { decodeCursor, encodeCursor } from "@webiny/db-dynamodb/utils/cursor";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { FileDynamoDbFieldPlugin } from "~/plugins/FileDynamoDbFieldPlugin";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { get as getEntityItem } from "@webiny/db-dynamodb/utils/get";
import { createStandardEntity, DbItem } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { PluginsContainer } from "@webiny/plugins";

type FileItem = DbItem<File>;
type FileAliasItem = DbItem<FileAlias>;

interface ConstructorParams {
    documentClient: DocumentClient;
    plugins: PluginsContainer;
}

interface QueryAllOptionsParams {
    where: FileManagerFilesStorageOperationsListParamsWhere;
}

interface CreatePartitionKeyParams {
    locale: string;
    tenant: string;
    id: string;
}

type CreateGSI1PartitionKeyParams = Pick<CreatePartitionKeyParams, "tenant" | "locale">;

export class FilesStorageOperations implements FileManagerFilesStorageOperations {
    private readonly plugins: PluginsContainer;
    private readonly table: Table;
    private readonly fileEntity: Entity<any>;
    private readonly aliasEntity: Entity<any>;

    public constructor({ documentClient, plugins }: ConstructorParams) {
        this.plugins = plugins;
        this.table = createTable({ documentClient });
        this.fileEntity = createStandardEntity(this.table, "FM.File");
        this.aliasEntity = createStandardEntity(this.table, "FM.FileAlias");
    }

    public async get(params: FileManagerFilesStorageOperationsGetParams): Promise<File | null> {
        const { where } = params;
        const keys = {
            PK: this.createPartitionKey(where),
            SK: "A"
        };
        try {
            const file = await getEntityItem<{ data: File }>({
                entity: this.fileEntity,
                keys
            });

            return file ? file.data : null;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch requested file.",
                ex.code || "GET_FILE_ERROR",
                {
                    error: ex,
                    where
                }
            );
        }
    }

    public async create(params: FileManagerFilesStorageOperationsCreateParams): Promise<File> {
        const { file } = params;

        const items: any[] = [];

        const item: FileItem = {
            PK: this.createPartitionKey(file),
            SK: "A",
            GSI1_PK: this.createGSI1PartitionKey(file),
            GSI1_SK: file.id,
            TYPE: "fm.file",
            data: file
        };

        items.push(this.fileEntity.putBatch(item));

        this.createNewAliasesRecords(file).forEach(alias => {
            items.push(this.aliasEntity.putBatch(alias));
        });

        try {
            await batchWriteAll({
                table: this.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create a new file in the DynamoDB.",
                ex.code || "CREATE_FILE_ERROR",
                {
                    error: ex,
                    items
                }
            );
        }

        return file;
    }

    public async update(params: FileManagerFilesStorageOperationsUpdateParams): Promise<File> {
        const { file } = params;

        const items: any[] = [];

        const item: FileItem = {
            PK: this.createPartitionKey(file),
            SK: "A",
            GSI1_PK: this.createGSI1PartitionKey(file),
            GSI1_SK: file.id,
            TYPE: "fm.file",
            data: file
        };

        items.push(this.fileEntity.putBatch(item));

        const existingAliases = await queryAll<FileAliasItem>({
            entity: this.aliasEntity,
            partitionKey: `T#${file.tenant}#L#${file.locale}#FM#FILE#${file.id}`,
            options: {
                beginsWith: `ALIAS#`
            }
        });

        const newAliases = this.createNewAliasesRecords(
            file,
            existingAliases.map(alias => alias.data)
        );

        newAliases.forEach(alias => {
            items.push(this.aliasEntity.putBatch(alias));
        });

        // Delete aliases that are in the DB but are NOT in the file.
        for (const { data } of existingAliases) {
            if (!file.aliases.some(alias => data.alias === alias)) {
                items.push(
                    this.aliasEntity.deleteBatch({
                        PK: this.createPartitionKey(file),
                        SK: `ALIAS#${data.alias}`
                    })
                );
            }
        }

        try {
            await batchWriteAll({
                table: this.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update a file in the DynamoDB.",
                ex.code || "UPDATE_FILE_ERROR",
                {
                    items
                }
            );
        }
        return params.file;
    }

    public async delete(params: FileManagerFilesStorageOperationsDeleteParams): Promise<void> {
        const { file } = params;
        const keys = {
            PK: this.createPartitionKey(file),
            SK: "A"
        };

        const aliasItems = await queryAll({
            entity: this.aliasEntity,
            partitionKey: keys.PK,
            options: {
                beginsWith: "ALIAS#"
            }
        });

        // All items to delete in batch
        const items: any[] = [];

        try {
            // Delete the main file item
            items.push(this.fileEntity.deleteBatch(keys));

            // Delete file alias items
            aliasItems.forEach(item => {
                items.push(
                    this.aliasEntity.deleteBatch({
                        PK: item.PK,
                        SK: item.SK
                    })
                );
            });

            await batchWriteAll({ table: this.table, items });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete file from the DynamoDB.",
                ex.code || "DELETE_FILE_ERROR",
                {
                    error: ex,
                    file,
                    keys,
                    aliasItems
                }
            );
        }
    }

    public async createBatch(
        params: FileManagerFilesStorageOperationsCreateBatchParams
    ): Promise<File[]> {
        const { files } = params;

        // Items to be written in batch
        const items: any[] = [];

        files.forEach(file => {
            items.push(
                this.fileEntity.putBatch({
                    PK: this.createPartitionKey(file),
                    SK: "A",
                    GSI1_PK: this.createGSI1PartitionKey(file),
                    GSI1_SK: file.id,
                    TYPE: "fm.file",
                    data: file
                })
            );

            this.createNewAliasesRecords(file).forEach(alias => {
                items.push(this.aliasEntity.putBatch(alias));
            });
        });

        try {
            await batchWriteAll({
                table: this.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch insert a list of files.",
                ex.code || "BATCH_CREATE_FILES_ERROR",
                {
                    error: ex,
                    files
                }
            );
        }
        return files;
    }

    public async list(
        params: FileManagerFilesStorageOperationsListParams
    ): Promise<FileManagerFilesStorageOperationsListResponse> {
        const { where: initialWhere, limit, after, sort } = params;

        const options = this.createQueryAllOptions({
            where: initialWhere
        });
        const queryAllParams = {
            entity: this.fileEntity,
            partitionKey: this.createGSI1PartitionKey(initialWhere),
            options
        };
        let items = [];
        try {
            const dbItems = await queryAll<{ data: File }>(queryAllParams);
            items = dbItems.map(item => item.data);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not query for the files.",
                ex.code || "FILE_LIST_ERROR",
                {
                    error: ex,
                    where: initialWhere,
                    limit,
                    after,
                    sort,
                    queryParams: {
                        options,
                        partitionKey: queryAllParams.partitionKey,
                        entity: queryAllParams.entity.name,
                        table: queryAllParams.entity.table.name
                    }
                }
            );
        }

        const where: Partial<FileManagerFilesStorageOperationsListParamsWhere> & {
            contains?: { fields: string[]; value: string };
        } = {
            ...initialWhere
        };
        if (where.search) {
            where.contains = {
                fields: ["name", "tags"],
                value: where.search
            };
        }
        delete where["tenant"];
        delete where["locale"];
        delete where["search"];

        const fields = this.plugins.byType<FileDynamoDbFieldPlugin>(FileDynamoDbFieldPlugin.type);
        /**
         * Filter the read items via the code.
         * It will build the filters out of the where input and transform the values it is using.
         */
        const filteredFiles = filterItems({
            plugins: this.plugins,
            items,
            where,
            fields
        });

        const totalCount = filteredFiles.length;
        /**
         * Sorting is also done via the code.
         * It takes the sort input and sorts by it via the lodash sortBy method.
         */
        const sortedFiles = sortItems({
            items: filteredFiles,
            sort,
            fields
        });

        const start = parseInt(decodeCursor(after) || "0") || 0;
        const hasMoreItems = totalCount > start + limit;
        const end = limit > totalCount + start + limit ? undefined : start + limit;
        const files = sortedFiles.slice(start, end);
        /**
         * Although we do not need a cursor here, we will use it as such to keep it standardized.
         * Number is simply encoded.
         */
        const cursor = files.length > 0 ? encodeCursor(start + limit) : null;

        const meta = {
            hasMoreItems,
            totalCount: totalCount,
            cursor
        };

        return [files, meta];
    }

    public async tags(
        params: FileManagerFilesStorageOperationsTagsParams
    ): Promise<FileManagerFilesStorageOperationsTagsResponse> {
        const { where: initialWhere } = params;

        const queryAllParams = {
            entity: this.fileEntity,
            partitionKey: this.createGSI1PartitionKey(initialWhere),
            options: {
                index: "GSI1",
                gte: " ",
                reverse: false
            }
        };
        let results = [];
        try {
            const dbItems = await queryAll<{ data: File }>(queryAllParams);
            results = dbItems.map(item => item.data);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Error in the DynamoDB query.",
                ex.code || "DYNAMODB_ERROR",
                {
                    error: ex,
                    query: queryAllParams
                }
            );
        }

        const fields = this.plugins.byType<FileDynamoDbFieldPlugin>(FileDynamoDbFieldPlugin.type);

        const where: Partial<FileManagerFilesStorageOperationsTagsParamsWhere> = {
            ...initialWhere
        };

        delete where["tenant"];
        delete where["locale"];

        /**
         * Filter the read items via the code.
         * It will build the filters out of the where input and transform the values it is using.
         */
        const filteredItems = filterItems({
            plugins: this.plugins,
            items: results,
            where,
            fields
        });

        /**
         * Aggregate all the tags from all the filtered items.
         */
        const tagsObject = filteredItems.reduce((collection, item) => {
            const tags = Array.isArray(item.tags) ? item.tags : [];
            for (const tag of tags) {
                if (!collection[tag]) {
                    collection[tag] = [];
                }
                collection[tag].push(item.id);
            }
            return collection;
        }, {} as Record<string, string[]>);

        const tags: string[] = Object.keys(tagsObject);

        const hasMoreItems = false;
        const totalCount = tags.length;

        const meta: FileManagerFilesStorageOperationsListResponseMeta = {
            hasMoreItems,
            totalCount,
            cursor: null
        };

        return [tags, meta];
    }

    private createQueryAllOptions({ where }: QueryAllOptionsParams): DynamoDBToolboxQueryOptions {
        const options: DynamoDBToolboxQueryOptions = { index: "GSI1" };
        if (where.id) {
            options.eq = where.id;
        } else {
            options.gt = " ";
        }
        return options;
    }

    private createPartitionKey(params: CreatePartitionKeyParams): string {
        const { tenant, locale, id } = params;
        return `T#${tenant}#L#${locale}#FM#FILE#${id}`;
    }
    private createGSI1PartitionKey(params: CreateGSI1PartitionKeyParams): string {
        const { tenant, locale } = params;
        return `T#${tenant}#L#${locale}#FM#FILES`;
    }

    private createNewAliasesRecords(
        file: File,
        existingAliases: FileAlias[] = []
    ): FileAliasItem[] {
        return (file.aliases || [])
            .map(alias => {
                // If alias is already in the DB, skip it.
                if (existingAliases.find(item => item.alias === alias)) {
                    return null;
                }

                // Add a new alias.
                return {
                    PK: this.createPartitionKey(file),
                    SK: `ALIAS#${alias}`,
                    GSI1_PK: `T#${file.tenant}#FM#FILE_ALIASES`,
                    GSI1_SK: alias,
                    TYPE: "fm.fileAlias",
                    data: {
                        alias,
                        tenant: file.tenant,
                        locale: file.locale,
                        fileId: file.id,
                        key: file.key
                    }
                };
            })
            .filter(Boolean) as FileAliasItem[];
    }
}
