import mdbid from "mdbid";
import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";
import Error from "@webiny/error";
import { File, FileManagerContext, FilePermission, FilesCRUD } from "~/types";
import defaults from "./utils/defaults";
import { paginateBatch } from "./utils/paginateBatch";
import { decodeCursor, encodeCursor } from "./utils/cursors";
import getPKPrefix from "./utils/getPKPrefix";
import createFileModel from "./utils/createFileModel";
import checkBasePermissions from "./utils/checkBasePermissions";

const BATCH_CREATE_MAX_FILES = 20;

const getFileDocForES = (
    file: File & { [key: string]: any },
    locale: string,
    context: FileManagerContext
) => ({
    tenant: context.tenancy.getCurrentTenant().id,
    id: file.id,
    createdOn: file.createdOn,
    key: file.key,
    size: file.size,
    type: file.type,
    name: file.name,
    tags: file.tags,
    createdBy: file.createdBy,
    meta: file.meta,
    locale,
    webinyVersion: context.WEBINY_VERSION
});

/**
 * If permission is limited to "own" files only, check that current identity owns the file.
 */
const checkOwnership = (file: File, permission: FilePermission, context: FileManagerContext) => {
    if (permission?.own === true) {
        const identity = context.security.getIdentity();
        if (file.createdBy.id !== identity.id) {
            throw new NotAuthorizedError();
        }
    }
};

export default (context: FileManagerContext) => {
    const { db, i18nContent, tenancy } = context;
    const localeCode = i18nContent?.locale?.code;

    const PK_FILE = id => `${getPKPrefix(context)}F#${id}`;

    return {
        async getFile(id: string) {
            const permission = await checkBasePermissions(context, { rwd: "r" });

            const [[file]] = await db.read<File>({
                ...defaults.db,
                query: { PK: PK_FILE(id), SK: "A" },
                limit: 1
            });

            if (!file) {
                throw new NotFoundError(`File with id "${id}" does not exists.`);
            }

            checkOwnership(file, permission, context);

            return file;
        },
        async createFile(data) {
            await checkBasePermissions(context, { rwd: "w" });
            const identity = context.security.getIdentity();
            const tenant = tenancy.getCurrentTenant();

            const FileModel = createFileModel();
            const fileData = new FileModel().populate(data);
            await fileData.validate();

            const id = mdbid();

            const file = {
                id,
                tenant: tenant.id,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                ...(await fileData.toJSON())
            };

            // Save file to DB.
            await db
                .batch()
                .create({
                    ...defaults.db,
                    data: {
                        PK: PK_FILE(id),
                        SK: "A",
                        TYPE: "fm.file",
                        ...file
                    }
                })
                .create({
                    ...defaults.esDb,
                    data: {
                        PK: PK_FILE(id),
                        SK: "A",
                        index: defaults.es(context).index,
                        data: getFileDocForES(file, localeCode, context)
                    }
                })
                .execute();

            return file;
        },
        async updateFile(id, data) {
            const permission = await checkBasePermissions(context, { rwd: "w" });
            const FILE_PK = PK_FILE(id);

            const [[file]] = await db.read<File>({
                ...defaults.db,
                query: { PK: FILE_PK, SK: "A" },
                limit: 1
            });

            if (!file) {
                throw new NotFoundError(`File with id "${id}" does not exists.`);
            }

            checkOwnership(file, permission, context);

            const FileModel = createFileModel(false);
            const updatedFileData = new FileModel().populate(data);
            await updatedFileData.validate();

            const updateFile = await updatedFileData.toJSON({ onlyDirty: true });
            Object.assign(file, updateFile);

            await db
                .batch()
                .update({
                    ...defaults.db,
                    query: { PK: FILE_PK, SK: "A" },
                    data: file
                })
                .update({
                    ...defaults.esDb,
                    query: {
                        PK: FILE_PK,
                        SK: "A"
                    },
                    data: {
                        PK: FILE_PK,
                        SK: "A",
                        index: defaults.es(context).index,
                        data: getFileDocForES(file, localeCode, context)
                    }
                })
                .execute();

            return file;
        },
        async deleteFile(id) {
            const permission = await checkBasePermissions(context, { rwd: "d" });

            const file = await this.getFile(id);
            if (!file) {
                throw new NotFoundError(`File with id "${id}" does not exists.`);
            }

            checkOwnership(file, permission, context);

            // Delete from DB.
            await db
                .batch()
                .delete({
                    ...defaults.db,
                    query: { PK: PK_FILE(id), SK: "A" }
                })
                .delete({
                    ...defaults.esDb,
                    query: { PK: PK_FILE(id), SK: "A" }
                })
                .execute();

            return true;
        },
        async createFilesInBatch(data) {
            if (!Array.isArray(data)) {
                throw new Error(`"data" must be an array.`, "CREATE_FILES_NON_ARRAY");
            }

            if (data.length === 0) {
                throw new Error(
                    `"data" argument must contain at least one file.`,
                    "CREATE_FILES_MIN_FILES"
                );
            }

            if (data.length > BATCH_CREATE_MAX_FILES) {
                throw new Error(
                    `"data" argument must not contain more than ${BATCH_CREATE_MAX_FILES} files.`,
                    "CREATE_FILES_MAX_FILES"
                );
            }

            await checkBasePermissions(context, { rwd: "w" });

            const identity = context.security.getIdentity();
            const tenant = context.tenancy.getCurrentTenant();
            const createdBy = {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            };

            const FileModel = createFileModel();
            const { index } = defaults.es(context);
            const files = [];

            // Process files 12 by 12. This will create DynamoDB batches of 24 (1 file also has 1 ES record).
            await paginateBatch(data, 10, async items => {
                const batch = db.batch();
                for (let i = 0; i < items.length; i++) {
                    const fileInstance = new FileModel().populate(items[i]);
                    await fileInstance.validate();

                    const file = {
                        ...(await fileInstance.toJSON()),
                        id: mdbid(),
                        tenant: tenant.id,
                        createdBy
                    };

                    files.push(file);

                    batch
                        .create({
                            data: {
                                PK: PK_FILE(file.id),
                                SK: "A",
                                ...file
                            }
                        })
                        .create({
                            ...defaults.esDb,
                            data: {
                                PK: PK_FILE(file.id),
                                SK: "A",
                                index,
                                data: getFileDocForES(file, localeCode, context)
                            }
                        });
                }
                await batch.execute();
            });

            return files;
        },
        async listFiles(opts = {}) {
            const permission = await checkBasePermissions(context, { rwd: "r" });

            const { i18nContent, security, elasticSearch, tenancy } = context;
            const identity = security.getIdentity();
            const esDefaults = defaults.es(context);

            const { limit = 40, search = "", types = [], tags = [], ids = [], after = null } = opts;

            const must: any[] = [
                // Skip files created by the system, eg. installation files.
                { term: { "meta.private": false } },
                // Filter files for current content locale
                { term: { "locale.keyword": i18nContent.locale.code } }
            ];

            // When ES index is shared between tenants, we need to filter records by tenant ID
            const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
            if (sharedIndex) {
                const tenant = tenancy.getCurrentTenant();
                must.push({ term: { "tenant.keyword": tenant.id } });
            }

            if (permission.own === true) {
                must.push({ term: { "createdBy.id.keyword": identity.id } });
                must.push({ term: { "createdBy.type.keyword": identity.type } });
            }

            if (Array.isArray(types) && types.length) {
                must.push({ terms: { "type.keyword": types } });
            }

            if (search) {
                must.push({
                    bool: {
                        should: [
                            { wildcard: { name: `*${search}*` } },
                            { terms: { tags: search.toLowerCase().split(" ") } }
                        ]
                    }
                });
            }

            if (Array.isArray(tags) && tags.length > 0) {
                must.push({
                    terms: { "tags.keyword": tags.map(tag => tag.toLowerCase()) }
                });
            }

            if (Array.isArray(ids) && ids.length > 0) {
                must.push({
                    terms: { "id.keyword": ids }
                });
            }

            const body = {
                query: {
                    constant_score: {
                        filter: {
                            bool: {
                                must: must
                            }
                        }
                    }
                },
                size: limit,
                sort: [{ "id.keyword": "desc" }]
            };

            if (after) {
                body["search_after"] = decodeCursor(after);
            }

            const response = await elasticSearch.search({
                ...esDefaults,
                body
            });

            const { hits, total } = response.body.hits;
            const files = hits.map(item => item._source);

            // Cursor is the `sort` value of the last item in the array.
            // https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after

            const meta = {
                totalCount: total.value,
                cursor: files.length > 0 ? encodeCursor(hits[files.length - 1].sort) : null
            };

            return [files, meta];
        },
        async listTags() {
            await checkBasePermissions(context);
            const { i18nContent, tenancy } = context;
            const esDefaults = defaults.es(context);

            const must: any = [
                {
                    term: { "locale.keyword": i18nContent.locale.code }
                }
            ];

            // When ES index is shared between tenants, we need to filter records by tenant ID
            const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
            if (sharedIndex) {
                const tenant = tenancy.getCurrentTenant();
                must.push({ term: { "tenant.keyword": tenant.id } });
            }

            const response = await context.elasticSearch.search({
                ...esDefaults,
                body: {
                    query: {
                        bool: {
                            must: must
                        }
                    },
                    size: 0,
                    aggs: {
                        listTags: {
                            terms: { field: "tags.keyword" }
                        }
                    }
                }
            });

            return response.body.aggregations.listTags.buckets.map(item => item.key) || [];
        }
    } as FilesCRUD;
};
