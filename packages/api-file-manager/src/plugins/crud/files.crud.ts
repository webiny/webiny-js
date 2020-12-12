import mdbid from "mdbid";
import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";
import Error from "@webiny/error";
import { File, FileManagerContext, FilePermission, FilesCRUD } from "../../types";
import defaults from "./utils/defaults";
import { decodeCursor, encodeCursor } from "./utils/cursors";
import getPKPrefix from "./utils/getPKPrefix";
import createFileModel from "./utils/createFileModel";
import checkBasePermissions from "./utils/checkBasePermissions";

const BATCH_CREATE_MAX_FILES = 20;

const getFileDocForES = (file: File & { [key: string]: any }, locale: string) => ({
    id: file.id,
    createdOn: file.createdOn,
    key: file.key,
    size: file.size,
    type: file.type,
    name: file.name,
    tags: file.tags,
    createdBy: file.createdBy,
    meta: file.meta,
    locale
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
    const { db, i18nContent, elasticSearch, security } = context;
    const localeCode = i18nContent?.locale?.code;

    const PK_FILE = () => `${getPKPrefix(context)}F`;

    return {
        async getFile(id: string) {
            const permission = await checkBasePermissions(context, { rwd: "r" });

            const [[file]] = await db.read<File>({
                ...defaults.db,
                query: { PK: PK_FILE(), SK: id },
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
            const tenant = security.getTenant();

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
            await db.create({
                data: {
                    PK: PK_FILE(),
                    SK: file.id,
                    TYPE: "fm.file",
                    ...file
                }
            });

            // Index file to "ElasticSearch".
            await elasticSearch.create({
                ...defaults.es(context),
                id,
                body: getFileDocForES(file, localeCode)
            });

            return file;
        },
        async updateFile(id, data) {
            const permission = await checkBasePermissions(context, { rwd: "w" });

            const [[file]] = await db.read<File>({
                ...defaults.db,
                query: { PK: PK_FILE(), SK: id },
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

            await db.update({
                ...defaults.db,
                query: { PK: PK_FILE(), SK: id },
                data: updateFile
            });

            // Index file in "Elastic Search"
            await elasticSearch.update({
                ...defaults.es(context),
                id,
                body: {
                    doc: updateFile
                }
            });

            return { ...file, ...updateFile };
        },
        async deleteFile(id) {
            const permission = await checkBasePermissions(context, { rwd: "d" });

            const file = await this.getFile(id);
            if (!file) {
                throw new NotFoundError(`File with id "${id}" does not exists.`);
            }

            checkOwnership(file, permission, context);

            // Delete from DB.
            await db.delete({
                ...defaults.db,
                query: { PK: PK_FILE(), SK: id }
            });

            // Delete index form ES.
            await elasticSearch.delete({
                ...defaults.es(context),
                id
            });
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
            const tenant = context.security.getTenant();
            const createdBy = {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            };

            // Use Batch to save files in DB.
            const batch = db.batch();
            const files = [];

            const FileModel = createFileModel();

            for (let i = 0; i < data.length; i++) {
                const fileData = data[i];

                const fileInstance = new FileModel().populate(fileData);
                await fileInstance.validate();

                const file = {
                    ...(await fileInstance.toJSON()),
                    id: mdbid(),
                    tenant: tenant.id,
                    createdBy
                };

                files.push(file);

                batch.create({
                    data: {
                        PK: PK_FILE(),
                        SK: file.id,
                        ...file
                    }
                });
            }

            await batch.execute();

            // Index files in ES.
            // @ts-ignore
            const body = files.flatMap(doc => [
                { index: { _index: defaults.es(context).index, _id: doc.id } },
                getFileDocForES(doc, localeCode)
            ]);

            const { body: bulkResponse } = await elasticSearch.bulk({ body });
            if (bulkResponse.errors) {
                const erroredDocuments = [];
                // The items array has the same order of the dataset we just indexed.
                // The presence of the `error` key indicates that the operation
                // that we did for the document has failed.
                bulkResponse.items.forEach((action, i) => {
                    const operation = Object.keys(action)[0];
                    if (action[operation].error) {
                        erroredDocuments.push({
                            // If the status is 429 it means that you can retry the document,
                            // otherwise it's very likely a mapping error, and you should
                            // fix the document before to try it again.
                            status: action[operation].status,
                            error: action[operation].error,
                            operation: body[i * 2],
                            document: body[i * 2 + 1]
                        });
                    }
                });
                console.warn("Bulk index of files failed.");
                console.log(erroredDocuments);
            }

            return files;
        },
        async listFiles(opts = {}) {
            const permission = await checkBasePermissions(context, { rwd: "r" });

            const { i18nContent, security, elasticSearch } = context;
            const identity = security.getIdentity();
            const esDefaults = defaults.es(context);

            const { limit = 40, search = "", types = [], tags = [], ids = [], after = null } = opts;

            const must: any[] = [
                // Skip files created by the system, eg. installation files.
                { term: { "meta.private": false } },
                // Filter files for current content locale
                { term: { "locale.keyword": i18nContent.locale.code } }
            ];

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
                    // eslint-disable-next-line @typescript-eslint/camelcase
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
            const { i18nContent } = context;
            const esDefaults = defaults.es(context);

            const response = await context.elasticSearch.search({
                ...esDefaults,
                body: {
                    query: {
                        term: { "locale.keyword": i18nContent.locale.code }
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
