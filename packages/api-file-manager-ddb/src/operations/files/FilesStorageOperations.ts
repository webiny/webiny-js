import {
    File,
    FileManagerContext,
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
import defineTable from "~/definitions/table";
import defineFilesEntity from "~/definitions/filesEntity";
import { queryOptions as DynamoDBToolboxQueryOptions } from "dynamodb-toolbox/dist/classes/Table";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { decodeCursor, encodeCursor } from "@webiny/db-dynamodb/utils/cursor";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { FileDynamoDbFieldPlugin } from "~/plugins/FileDynamoDbFieldPlugin";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { get as getEntityItem } from "@webiny/db-dynamodb/utils/get";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";

interface FileItem extends File {
    PK: string;
    SK: string;
    TYPE: string;
}

interface ConstructorParams {
    context: FileManagerContext;
}

interface QueryAllOptionsParams {
    where: FileManagerFilesStorageOperationsListParamsWhere;
}

interface CreatePartitionKeyParams {
    locale: string;
    tenant: string;
}

interface CreateSortKeyParams {
    id: string;
}

export class FilesStorageOperations implements FileManagerFilesStorageOperations {
    private readonly _context: FileManagerContext;
    private readonly table: Table;
    private readonly entity: Entity<any>;

    private get context(): FileManagerContext {
        return this._context;
    }

    public constructor({ context }: ConstructorParams) {
        this._context = context;
        this.table = defineTable({
            context
        });

        this.entity = defineFilesEntity({
            context,
            table: this.table
        });
    }

    public async get(params: FileManagerFilesStorageOperationsGetParams): Promise<File | null> {
        const { where } = params;
        const keys = {
            PK: this.createPartitionKey(where),
            SK: this.createSortKey(where)
        };
        try {
            const file = await getEntityItem<File>({
                entity: this.entity,
                keys
            });
            return cleanupItem<File>(this.entity, file);
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

        const keys = {
            PK: this.createPartitionKey(file),
            SK: this.createSortKey(file)
        };
        const item: FileItem = {
            ...file,
            ...keys,
            TYPE: "fm.file"
        };
        try {
            await this.entity.put(item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create a new file in the DynamoDB.",
                ex.code || "CREATE_FILE_ERROR",
                {
                    error: ex,
                    item
                }
            );
        }

        return file;
    }

    public async update(params: FileManagerFilesStorageOperationsUpdateParams): Promise<File> {
        const { file } = params;
        const keys = {
            PK: this.createPartitionKey(file),
            SK: this.createSortKey(file)
        };

        const item: FileItem = {
            ...file,
            ...keys,
            TYPE: "fm.file"
        };
        try {
            await this.entity.put(item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update a file in the DynamoDB.",
                ex.code || "UPDATE_FILE_ERROR",
                {
                    error: ex,
                    item
                }
            );
        }
        return file;
    }

    public async delete(params: FileManagerFilesStorageOperationsDeleteParams): Promise<void> {
        const { file } = params;
        const keys = {
            PK: this.createPartitionKey(file),
            SK: this.createSortKey(file)
        };

        try {
            await this.entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete file from the DynamoDB.",
                ex.code || "DELETE_FILE_ERROR",
                {
                    error: ex,
                    file,
                    keys
                }
            );
        }
    }

    public async createBatch(
        params: FileManagerFilesStorageOperationsCreateBatchParams
    ): Promise<File[]> {
        const { files } = params;

        const items = files.map(file => {
            return this.entity.putBatch({
                ...file,
                PK: this.createPartitionKey(file),
                SK: this.createSortKey(file),
                TYPE: "fm.file"
            });
        });

        try {
            await batchWriteAll({
                table: this.entity.table,
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
            entity: this.entity,
            partitionKey: this.createPartitionKey(initialWhere),
            options
        };
        let items = [];
        try {
            items = await queryAll<File>(queryAllParams);
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

        const fields = this.context.plugins.byType<FileDynamoDbFieldPlugin>(
            FileDynamoDbFieldPlugin.type
        );
        /**
         * Filter the read items via the code.
         * It will build the filters out of the where input and transform the values it is using.
         */
        const filteredFiles = filterItems({
            plugins: this.context.plugins,
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
            entity: this.entity,
            partitionKey: this.createPartitionKey(initialWhere),
            options: {
                gte: " ",
                reverse: false
            }
        };
        let results = [];
        try {
            results = await queryAll<File>(queryAllParams);
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

        const fields = this.context.plugins.byType<FileDynamoDbFieldPlugin>(
            FileDynamoDbFieldPlugin.type
        );

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
            plugins: this.context.plugins,
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
        const options: DynamoDBToolboxQueryOptions = {};
        if (where.id) {
            options.eq = where.id;
        }
        return options;
    }

    private createPartitionKey(params: CreatePartitionKeyParams): string {
        const { tenant, locale } = params;
        return `T#${tenant}#L#${locale}#FM#F`;
    }

    private createSortKey(params: CreateSortKeyParams) {
        const { id } = params;

        return id;
    }
}
