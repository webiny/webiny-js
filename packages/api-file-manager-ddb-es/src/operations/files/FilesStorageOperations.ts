import {
    File,
    FileAlias,
    FileManagerFilesStorageOperations,
    FileManagerFilesStorageOperationsCreateBatchParams,
    FileManagerFilesStorageOperationsCreateParams,
    FileManagerFilesStorageOperationsDeleteParams,
    FileManagerFilesStorageOperationsGetParams,
    FileManagerFilesStorageOperationsListParams,
    FileManagerFilesStorageOperationsListResponse,
    FileManagerFilesStorageOperationsListResponseMeta,
    FileManagerFilesStorageOperationsTagsParams,
    FileManagerFilesStorageOperationsTagsResponse,
    FileManagerFilesStorageOperationsUpdateParams
} from "@webiny/api-file-manager/types";
import { Client } from "@elastic/elasticsearch";
import { Entity, Table } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import defineTable from "~/definitions/table";
import defineEsTable from "~/definitions/tableElasticsearch";
import defineFilesEsEntity from "~/definitions/filesElasticsearchEntity";
import { configurations } from "~/configurations";
import { encodeCursor, compress } from "@webiny/api-elasticsearch";
import { createElasticsearchBody } from "~/operations/files/body";
import { transformFromIndex, transformToIndex } from "~/operations/files/transformers";
import { FileIndexTransformPlugin } from "~/plugins/FileIndexTransformPlugin";
import { createStandardEntity, DbItem } from "@webiny/db-dynamodb";
import { get as getEntityItem } from "@webiny/db-dynamodb/utils/get";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import {
    ElasticsearchSearchResponse,
    SearchBody as ElasticsearchSearchBody
} from "@webiny/api-elasticsearch/types";
import { FileManagerContext } from "~/types";
import { queryAll } from "@webiny/db-dynamodb/utils/query";

type FileItem = DbItem<File>;
type FileAliasItem = DbItem<FileAlias>;

interface EsFileItem {
    PK: string;
    SK: string;
    index: string;
    data: any;
}

interface ConstructorParams {
    context: FileManagerContext;
}

interface CreatePartitionKeyParams {
    locale: string;
    tenant: string;
    id: string;
}

type CreateGSI1PartitionKeyParams = Pick<CreatePartitionKeyParams, "tenant" | "locale">;

export class FilesStorageOperations implements FileManagerFilesStorageOperations {
    private readonly context: FileManagerContext;
    private readonly table: Table;
    private readonly esTable: Table;
    private readonly fileEntity: Entity<any>;
    private readonly esFileEntity: Entity<any>;
    private readonly aliasEntity: Entity<any>;

    private get esClient() {
        const ctx = this.context;
        if (!ctx.elasticsearch) {
            throw new WebinyError(
                "Missing Elasticsearch client on the context.",
                "ELASTICSEARCH_CLIENT_ERROR"
            );
        }
        return ctx.elasticsearch as Client;
    }

    public constructor({ context }: ConstructorParams) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.fileEntity = createStandardEntity(this.table, "FM.File");
        this.aliasEntity = createStandardEntity(this.table, "FM.FileAlias");

        this.esTable = defineEsTable({
            context
        });

        this.esFileEntity = defineFilesEsEntity({
            context,
            table: this.esTable
        });
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
                    items
                }
            );
        }

        // Create Elasticsearch data
        const esData = await transformToIndex({
            plugins: this.getFileIndexTransformPlugins(),
            file
        });
        const esCompressedData = await compress(this.context.plugins, esData);
        const esItem: EsFileItem = {
            PK: this.createPartitionKey(file),
            SK: "A",
            index: this.getElasticsearchIndex(),
            data: esCompressedData
        };

        try {
            await this.esFileEntity.put(esItem);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create a new file in the Elasticsearch DynamoDB table.",
                ex.code || "CREATE_FILE_ERROR",
                {
                    esItem
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

        // Create Elasticsearch data
        const esData = await transformToIndex({
            plugins: this.getFileIndexTransformPlugins(),
            file
        });
        const esCompressedData = await compress(this.context.plugins, esData);
        const esItem: EsFileItem = {
            PK: this.createPartitionKey(file),
            SK: "A",
            index: this.getElasticsearchIndex(),
            data: esCompressedData
        };

        try {
            await this.esFileEntity.put(esItem);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create a new file in the Elasticsearch DynamoDB table.",
                ex.code || "CREATE_FILE_ERROR",
                {
                    esItem
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

            // Delete file record from ES table
            await this.esFileEntity.delete(keys);
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

        const items = [];
        const esItems = [];

        for (const file of files) {
            const keys = {
                PK: this.createPartitionKey(file),
                SK: "A"
            };

            items.push(
                this.fileEntity.putBatch({
                    ...keys,
                    GSI1_PK: this.createGSI1PartitionKey(file),
                    GSI1_SK: file.id,
                    TYPE: "fm.file",
                    data: file
                })
            );

            this.createNewAliasesRecords(file).forEach(alias => {
                items.push(this.aliasEntity.putBatch(alias));
            });

            const esCompressedData = await compress(this.context.plugins, file);

            esItems.push(
                this.esFileEntity.putBatch({
                    ...keys,
                    index: this.getElasticsearchIndex(),
                    data: esCompressedData
                })
            );
        }

        try {
            await batchWriteAll({
                table: this.fileEntity.table,
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

        try {
            await batchWriteAll({
                table: this.esFileEntity.table,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch insert a list of files into Elasticsearch table.",
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
        const { where, limit, after, sort } = params;

        const body = createElasticsearchBody({
            context: this.context,
            where,
            limit,
            sort,
            after
        });

        let response: ElasticsearchSearchResponse<File>;
        try {
            response = await this.esClient.search({
                index: this.getElasticsearchIndex(),
                body
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not search for the files.",
                ex.code || "FILE_LIST_ERROR",
                {
                    where,
                    esBody: body
                }
            );
        }
        const plugins = this.getFileIndexTransformPlugins();
        const { hits, total } = response.body.hits;

        const files = await Promise.all(
            hits.map(async item => {
                return await transformFromIndex({
                    plugins,
                    file: item._source
                });
            })
        );

        let hasMoreItems = false;
        if (files.length > limit) {
            files.pop();
            hasMoreItems = true;
        }

        const meta = {
            hasMoreItems,
            totalCount: total.value,
            cursor: files.length > 0 ? encodeCursor(hits[files.length - 1].sort) || null : null
        };

        return [files, meta];
    }
    public async tags(
        params: FileManagerFilesStorageOperationsTagsParams
    ): Promise<FileManagerFilesStorageOperationsTagsResponse> {
        const { where, limit } = params;

        const initialBody = createElasticsearchBody({
            context: this.context,
            where,
            limit,
            sort: [],
            after: undefined
        });

        const body: ElasticsearchSearchBody = {
            ...initialBody,
            aggs: {
                listTags: {
                    terms: {
                        field: "tags.keyword"
                    }
                }
            }
        };

        let response: ElasticsearchSearchResponse<string> | undefined = undefined;

        try {
            response = await this.esClient.search({
                index: this.getElasticsearchIndex(),
                body
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Error in the Elasticsearch query.",
                ex.code || "ELASTICSEARCH_ERROR",
                {
                    body
                }
            );
        }

        const listTags = response.body.aggregations["listTags"] || { buckets: [] };

        const tags = listTags.buckets.map(item => item.key) || [];

        let hasMoreItems = false;
        const totalCount = tags.length;
        if (totalCount > limit + 1) {
            tags.pop();
            hasMoreItems = true;
        }

        const meta: FileManagerFilesStorageOperationsListResponseMeta = {
            hasMoreItems,
            totalCount,
            cursor: null
        };

        return [tags, meta];
    }

    private createPartitionKey(params: CreatePartitionKeyParams): string {
        const { tenant, locale, id } = params;
        return `T#${tenant}#L#${locale}#FM#FILE#${id}`;
    }
    private createGSI1PartitionKey(params: CreateGSI1PartitionKeyParams): string {
        const { tenant, locale } = params;
        return `T#${tenant}#L#${locale}#FM#FILES`;
    }

    private getFileIndexTransformPlugins(): FileIndexTransformPlugin[] {
        return this.context.plugins.byType<FileIndexTransformPlugin>(FileIndexTransformPlugin.type);
    }

    private getElasticsearchIndex(): string {
        const locale = this.context.i18n.getContentLocale();
        if (!locale) {
            throw new WebinyError(
                "Missing content locale in FilesStorageOperations.",
                "LOCALE_ERROR"
            );
        }
        const { index } = configurations.es({
            tenant: this.context.tenancy.getCurrentTenant().id,
            locale: locale.code
        });
        return index;
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
