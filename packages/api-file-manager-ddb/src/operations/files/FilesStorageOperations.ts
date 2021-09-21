import {
    File,
    FileManagerContext,
    FileManagerFilesStorageOperations,
    FileManagerFilesStorageOperationsCreateParams,
    FileManagerFilesStorageOperationsListParams,
    FileManagerFilesStorageOperationsListParamsWhere,
    FileManagerFilesStorageOperationsListResponse,
    FileManagerFilesStorageOperationsTagsParams,
    FileManagerFilesStorageOperationsTagsResponse,
    FileManagerFilesStorageOperationsUpdateParams
} from "@webiny/api-file-manager/types";
import { Entity, Table } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import defineTable from "~/definitions/table";
import defineFilesEntity from "~/definitions/filesEntity";
import lodashOmit from "lodash.omit";
import lodashChunk from "lodash.chunk";
import { queryOptions as DynamoDBToolboxQueryOptions } from "dynamodb-toolbox/dist/classes/Table";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { FilterExpressions } from "dynamodb-toolbox/dist/lib/expressionBuilder";
import { decodeCursor, encodeCursor } from "@webiny/db-dynamodb/utils/cursor";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { FileDynamoDbFieldPlugin } from "~/plugins/FileDynamoDbFieldPlugin";

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

/**
 * This is required due to sometimes file data sent is from the DynamoDB and we want to remove the unnecessary stuff.
 */
const cleanStorageFile = (file: File & Record<string, any>): File => {
    return lodashOmit(file, ["PK", "SK", "TYPE", "created", "modified", "entity"]);
};

export class FilesStorageOperations implements FileManagerFilesStorageOperations {
    private readonly _context: any;
    private readonly _table: Table;
    private readonly _entity: Entity<any>;

    private get context(): FileManagerContext {
        return this._context;
    }

    private get partitionKey(): string {
        const tenant = this.context.tenancy.getCurrentTenant();
        const locale = this.context.i18nContent.getLocale();
        if (!tenant) {
            throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
        }
        if (!locale) {
            throw new Error("Locale missing.");
        }
        return `T#${tenant.id}#L#${locale.code}#FM#F`;
    }

    public constructor({ context }: ConstructorParams) {
        this._context = context;
        this._table = defineTable({
            context
        });

        this._entity = defineFilesEntity({
            context,
            table: this._table
        });
    }

    public async get(id: string): Promise<File | null> {
        try {
            const file = await this._entity.get({
                PK: this.partitionKey,
                SK: this.getSortKey(id)
            });
            if (!file || !file.Item) {
                return null;
            }
            return cleanStorageFile(file.Item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch requested file.",
                ex.code || "GET_FILE_ERROR",
                {
                    id
                }
            );
        }
    }

    public async create(params: FileManagerFilesStorageOperationsCreateParams): Promise<File> {
        const { file } = params;

        const keys = {
            PK: this.partitionKey,
            SK: this.getSortKey(file.id)
        };
        const item: FileItem = {
            ...keys,
            TYPE: "fm.file",
            ...file
        };
        try {
            await this._entity.put(item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create a new file in the DynamoDB.",
                ex.code || "CREATE_FILE_ERROR",
                {
                    item
                }
            );
        }

        return file;
    }

    public async update({ file }: FileManagerFilesStorageOperationsUpdateParams): Promise<File> {
        const keys = {
            PK: this.partitionKey,
            SK: this.getSortKey(file.id)
        };

        const item: FileItem = {
            ...keys,
            TYPE: "fm.file",
            ...file
        };
        try {
            await this._entity.put(item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update a file in the DynamoDB.",
                ex.code || "UPDATE_FILE_ERROR",
                {
                    item
                }
            );
        }
        return file;
    }

    public async delete(id: string): Promise<void> {
        const keys = {
            PK: this.partitionKey,
            SK: this.getSortKey(id)
        };

        try {
            await this._entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete file from the DynamoDB.",
                ex.code || "DELETE_FILE_ERROR",
                {
                    id,
                    keys
                }
            );
        }
    }

    public async createBatch({ files }): Promise<File[]> {
        const fileChunks = lodashChunk(files, 25);

        for (const fileChunk of fileChunks) {
            const batches = [];
            for (const file of fileChunk) {
                const keys = {
                    PK: this.partitionKey,
                    SK: this.getSortKey(file.id)
                };
                batches.push(
                    this._entity.putBatch({
                        ...keys,
                        TYPE: "fm.file",
                        ...file
                    })
                );
            }
            try {
                await this._table.batchWrite(batches);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not batch insert a list of files.",
                    ex.code || "BATCH_CREATE_FILES_ERROR",
                    {
                        files: fileChunk,
                        items: batches
                    }
                );
            }
        }
        return files;
    }

    public async list(
        params: FileManagerFilesStorageOperationsListParams
    ): Promise<FileManagerFilesStorageOperationsListResponse> {
        const { where, limit, after, sort } = params;

        const options = this.createQueryAllOptions({
            where
        });
        const queryAllParams = {
            entity: this._entity,
            partitionKey: this.partitionKey,
            options
        };
        let items: FileItem[] = [];
        try {
            items = await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not query for the files.",
                ex.code || "FILE_LIST_ERROR",
                {
                    where,
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

        const fields = this.context.plugins.byType<FileDynamoDbFieldPlugin>(
            FileDynamoDbFieldPlugin.type
        );
        /**
         * Filter the read items via the code.
         * It will build the filters out of the where input and transform the values it is using.
         */
        const filteredFiles = filterItems({
            items,
            where,
            context: this.context,
            fields
        });

        const totalCount = filteredFiles.length;
        /**
         * Sorting is also done via the code.
         * It takes the sort input and sorts by it via the lodash sortBy method.
         */
        const sortedFiles = sortItems({
            context: this.context,
            items: filteredFiles,
            sort,
            fields
        });

        const start = decodeCursor(after) || 0;
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
        const { where } = params;

        const filters: FilterExpressions = [];
        if (where.locale) {
            filters.push({
                attr: "locale",
                eq: where.locale
            });
            delete where.locale;
        }
        if (where.tenant) {
            filters.push({
                attr: "tenant",
                eq: where.tenant
            });
            delete where.tenant;
        }

        const options: DynamoDBToolboxQueryOptions = {
            filters,
            reverse: false
        };

        let items: FileItem[] = [];

        const queryAllParams = {
            entity: this._entity,
            partitionKey: this.partitionKey,
            options
        };
        try {
            items = await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Error in the DynamoDB query.",
                ex.code || "DYNAMODB_ERROR",
                {
                    query: queryAllParams
                }
            );
        }
        /**
         * Aggregate all the tags from all the items in the database.
         */
        const tagsObject = items.reduce((collection, item) => {
            for (const tag of item.tags) {
                if (!collection[tag]) {
                    collection[tag] = [];
                }
                collection[tag].push(item.id);
            }
            return collection;
        }, {});

        const tags: string[] = Object.keys(tagsObject);

        const hasMoreItems = false;
        const totalCount = tags.length;

        const meta = {
            hasMoreItems,
            totalCount,
            cursor: null
        };

        return [tags, meta];
    }
    /**
     * Create the sort key for the file.
     * Actually those are just some checks.
     */
    private getSortKey(id: string) {
        if (!id || !id.match(/^([a-zA-Z0-9]+)$/)) {
            throw new WebinyError("Could not determine the file sort key.", "FILE_SORT_KEY_ERROR", {
                id
            });
        }
        return id;
    }

    private createQueryAllOptions({ where }: QueryAllOptionsParams): DynamoDBToolboxQueryOptions {
        const options: DynamoDBToolboxQueryOptions = {};
        if (where.id) {
            options.eq = where.id;
        }
        return options;
    }
}
