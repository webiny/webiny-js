import {
    CmsContentEntry,
    CmsContentEntryStorageOperations,
    CmsContentEntryStorageOperationsCreateArgs, CmsContentEntryStorageOperationsCreateRevisionFromArgs,
    CmsContentEntryStorageOperationsDeleteArgs, CmsContentEntryStorageOperationsDeleteRevisionArgs,
    CmsContentEntryStorageOperationsGetArgs,
    CmsContentEntryStorageOperationsListArgs, CmsContentEntryStorageOperationsListResponse,
    CmsContentEntryStorageOperationsUpdateArgs, CmsContentModel,
    CmsContext
} from "../../../../../types";

import WebinyError from "@webiny/error";
import * as utils from "../../../../../utils";
import {
    createElasticsearchLimit,
    createElasticsearchQueryBody,
    extractEntriesFromIndex,
    prepareEntryToIndex
} from "../../contentEntry/es";
import {entryFromStorageTransform, entryToStorageTransform} from "../../../utils/entryStorage";
import cloneDeep from "lodash/cloneDeep";
import {afterDeleteRevisionHook} from "../../contentEntry/afterDeleteRevision.hook";
import omit from "lodash/omit";


const TYPE_ENTRY = "cms.entry";
const TYPE_ENTRY_LATEST = TYPE_ENTRY + ".l";
const TYPE_ENTRY_PUBLISHED = TYPE_ENTRY + ".p";

const getEntryData = (context: CmsContext, entry: CmsContentEntry) => {
    return {
        ...omit(entry, ["PK", "SK", "TYPE",]),
        webinyVersion: context.WEBINY_VERSION
    }
};

const getESLatestEntryData = (context: CmsContext, entry: CmsContentEntry) => {
    return {
        ...getEntryData(context, entry),
        latest: true,
        __type: TYPE_ENTRY_LATEST,
    };
};

const getESPublishedEntryData = (context: CmsContext, entry: CmsContentEntry) => {
    return {
        ...getEntryData(context, entry),
        published: true,
        __type: TYPE_ENTRY_PUBLISHED,
    };
};

interface ConstructorArgs {
    context: CmsContext;
    basePrimaryKey: string;
}

/**
 * This implementation is not a general driver to fetch from DDB/Elastic.
 * Use some other implementation for general-use purpose.
 */
export default class CmsContentEntryCrudDynamoElastic implements CmsContentEntryStorageOperations {
    private readonly _context: CmsContext;
    private readonly _primaryKey: string;
    
    private get context(): CmsContext {
        return this._context;
    }
    
    public constructor({context, basePrimaryKey}: ConstructorArgs) {
        this._context = context;
        this._primaryKey = `${basePrimaryKey}#CME`;
    }
    
    public async create(model: CmsContentModel, {data}: CmsContentEntryStorageOperationsCreateArgs): Promise<CmsContentEntry> {
        const {db} = this.context;
        
        data.id = `${data.id}#${utils.zeroPad(data.version)}`;
        
        const storageEntry = await entryToStorageTransform(this.context, model, data);
        
        const esEntry = prepareEntryToIndex({
            context: this.context,
            model,
            originalEntry: cloneDeep(data),
            storageEntry: cloneDeep(storageEntry),
        });
        
        // TODO there should be no defaults like this anymore
        const {index: esIndex} = utils.defaults.es(this.context, model);
        
        
        const batch = db
            .batch()
            // Create main entry item
            .create({
                // TODO there should be no defaults like this anymore
                ...utils.defaults.db(),
                data: {
                    PK: this.getPrimaryKey(data.id),
                    SK: this.getSecondaryKeyRevision(data.version),
                    TYPE: TYPE_ENTRY,
                    ...storageEntry
                }
            })
            // Create "latest" entry item
            .create({
                // TODO there should be no defaults like this anymore
                ...utils.defaults.db(),
                data: {
                    PK: this.getPrimaryKey(data.id),
                    SK: this.getSecondaryKeyLatest(),
                    TYPE: TYPE_ENTRY_LATEST,
                    ...storageEntry
                }
            })
            .create({
                // TODO there should be no defaults like this anymore
                ...utils.defaults.esDb(),
                data: {
                    PK: this.getPrimaryKey(data.id),
                    SK: this.getSecondaryKeyLatest(),
                    index: esIndex,
                    data: getESLatestEntryData(this.context, esEntry)
                }
            });
        
        try {
            await batch.execute();
        } catch(ex) {
            throw new WebinyError(
                ex.message || "Could not insert data into the DynamoDB",
                ex.code || "CREATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry: data,
                }
            );
        }
        
        return storageEntry;
    }
    
    public async createRevisionFrom(model: CmsContentModel, args: CmsContentEntryStorageOperationsCreateRevisionFromArgs) {
        const {db} = this.context;
        
        const {originalEntry, data, latestEntry} = args;
        
        const storageData = await entryToStorageTransform(this.context, model, data);
        
        const esEntry = prepareEntryToIndex({
            context: this.context,
            model,
            originalEntry: cloneDeep(data),
            storageEntry: cloneDeep(storageData)
        });
        // TODO there should be no defaults like this anymore
        const {index: esIndex} = utils.defaults.es(this.context, model);
        
        const primaryKey = this.getPrimaryKey(storageData.id);
        const batch = db.batch();
        batch
            // Create main entry item
            .create({
                // TODO there should be no defaults like this anymore
                ...utils.defaults.db(),
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(storageData.version),
                    TYPE: TYPE_ENTRY,
                    ...getEntryData(this.context, storageData),
                }
            })
            // Update "latest" entry item
            .update({
                // TODO there should be no defaults like this anymore
                ...utils.defaults.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest(),
                    TYPE: TYPE_ENTRY_LATEST,
                    ...getEntryData(this.context, storageData),
                }
            })
            .update({
                // TODO there should be no defaults like this anymore
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest(),
                    index: esIndex,
                    data: getESLatestEntryData(this.context, esEntry),
                }
            });
        try {
            await batch.execute();
        } catch(ex) {
            throw new WebinyError(
                ex.message || "Could not create revision from given entry.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
                    originalEntry,
                    latestEntry,
                    data,
                    esEntry,
                }
            );
        }
        // There are no modifications on the entry created so just return the data.
        return data;
    }
    
    public async delete(model: CmsContentModel, args: CmsContentEntryStorageOperationsDeleteArgs): Promise<boolean> {
        return Promise.resolve(false);
    }
    
    public async deleteRevision(model: CmsContentModel, args: CmsContentEntryStorageOperationsDeleteRevisionArgs): Promise<boolean> {
        const {db} = this.context;
        const {entry, latestEntry, publishedEntry, previousEntry} = args;
        
        const revisionId = this.createRevisionId(entry.id, entry.version);
        
        const primaryKey = this.getPrimaryKey(entry.id);
        const batch = db.batch()
            .delete({
                ...utils.defaults.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(entry.version),
                }
            });
        const latestRevisionId = latestEntry ? this.createRevisionId(latestEntry.id, latestEntry.version) : null;
        const publishedRevisionId = latestEntry ? this.createRevisionId(publishedEntry.id, publishedEntry.version) : null;
        const isLatest = latestRevisionId === revisionId;
        const isPublished = publishedRevisionId === revisionId;
    
        const es = utils.defaults.es(this.context, model);
        
        if(isPublished) {
            batch.delete(
                {
                    ...utils.defaults.db(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyPublished()
                    }
                },
                {
                    ...utils.defaults.esDb(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyPublished()
                    }
                }
            );
        }
        if (isLatest && !latestEntry) {
            // If we haven't found the previous revision, this must must be the last revision.
            const deleteBatch = db.batch();
            batch
                .delete({
                    ...utils.defaults.db(),
                    query: {
                        PK: primaryKey,
                        SK: {$gte: " "},
                    }
                })
                .delete({
                    ...utils.defaults.esDb(),
                    query: {
                        PK: primaryKey,
                        SK: {$gte: " "},
                    },
                });
            try {
                await deleteBatch.execute();
            } catch(ex) {
                throw new WebinyError(
                    ex.message || "Could not delete revision from given entry.",
                    ex.code || "DELETE_REVISION_ERROR",
                    {
                        error: ex,
                        entry,
                        publishedEntry,
                    }
                );
            }
            return true;
        }
        else if(isLatest) {
            // Update latest entry data.
            batch
                .update({
                    ...utils.defaults.db(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyLatest()
                    },
                    data: {
                        ...latestEntry,
                        ...getESLatestEntryData(this.context, previousEntry),
                    }
                })
                .update({
                    ...utils.defaults.esDb(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyLatest()
                    },
                    data: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyLatest(),
                        index: es.index,
                        data: getESLatestEntryData(this.context, previousEntry)
                    }
                });
        }
        
        
        return true;
    }
    
    public async get(model: CmsContentModel, args: CmsContentEntryStorageOperationsGetArgs): Promise<CmsContentEntry | null> {
        throw new WebinyError("Unsupported operation.")
    }
    /**
     *
     * @param model
     * @param args
     */
    public async getMultiple(model: CmsContentModel, args: CmsContentEntryStorageOperationsGetArgs[]): Promise<(CmsContentEntry | null)[]> {
        const {db} = this.context;
        if(args.length === 0) {
            return [];
        }
        /**
         * This is a really specific use method so it should not be used in fetching a lot of items.
         * Either use list or some other way to get them.
         */
        else if(args.length > 3) {
            throw new WebinyError(
                "Unsupported getMultiple amount.",
                "MULTIPLE_GET_UNSUPPORTED",
                {
                    args,
                }
            )
        }
        const batch = db.batch();
        for(const arg of args) {
            batch
                .read({
                    ...utils.defaults.db(),
                    query: this.createQueryFromArg(arg),
                    sort: this.createSortFromArg(arg),
                    limit: 1,
                });
        }
        try {
            const results: (CmsContentEntry | undefined)[][] = await batch.execute();
            return results.map(items => items[0] || null);
        } catch(ex) {
            throw new WebinyError(
                ex.message,
                ex.code || "MULTIPLE_GET_ENTRY_ERROR",
                {
                    error: ex,
                    args,
                }
            );
        }
    }
    /**
     * Implemented search via the Elasticsearch.
     */
    public async list(model: CmsContentModel, args: CmsContentEntryStorageOperationsListArgs): Promise<CmsContentEntryStorageOperationsListResponse> {
        const {elasticSearch} = this.context;
        const limit = createElasticsearchLimit(args.limit, 50);
        const body = createElasticsearchQueryBody({
            model,
            args: {
                ...(args || {}),
                limit
            },
            context: this.context,
            parentObject: "values"
        });
        
        let response;
        try {
            response = await elasticSearch.search({
                ...utils.defaults.es(this.context, model),
                body
            });
        } catch(ex) {
            throw new WebinyError(ex.message, ex.code, ex.meta);
        }
        
        const {hits, total} = response.body.hits;
        const items = extractEntriesFromIndex({
            context: this.context,
            model,
            entries: hits.map(item => item._source)
        });
        
        const hasMoreItems = items.length > limit;
        if(hasMoreItems) {
            // Remove the last item from results, we don't want to include it.
            items.pop();
        }
        // Cursor is the `sort` value of the last item in the array.
        // https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
        const cursor = items.length > 0 ? utils.encodeElasticsearchCursor(hits[items.length - 1].sort) : null;
        return {
            hasMoreItems,
            totalCount: total.value,
            cursor,
            items,
        };
    }
    public async update(args: CmsContentEntryStorageOperationsUpdateArgs): Promise<CmsContentEntry> {
        return Promise.resolve(undefined);
    }
    /**
     * A method that creates query arg for the DynamoDB.
     * There are search limitations on the DDB so we are imposing them in the code.
     */
    private createQueryFromArg(arg: CmsContentEntryStorageOperationsGetArgs) {
        if(!arg.where) {
            throw new WebinyError(
                `Missing "where" argument.`,
                "SEARCH_ERROR",
                {
                    arg,
                }
            );
        }
        let secondaryKey: string;
        if(arg.where.latest) {
            secondaryKey = this.getSecondaryKeyLatest();
        }
        else if(arg.where.published) {
            secondaryKey = this.getSecondaryKeyPublished();
        }
        else if(arg.where.version !== undefined) {
            secondaryKey = this.getSecondaryKeyRevision(arg.where.version);
        }
        else {
            throw new WebinyError(
                "Unsupported search parameters.",
                "SEARCH_UNSUPPORTED",
                {
                    arg,
                }
            );
        }
        return {
            PK: this.getPrimaryKey(arg.where.id),
            SK: secondaryKey,
        };
    }
    /**
     * A method that creates sort arg for the DynamoDB.
     * There are sorting limitations on the DDB so we are imposing them in the code.
     */
    private createSortFromArg(arg: CmsContentEntryStorageOperationsGetArgs): Record<string, 1 | -1> {
        if(!arg.sort) {
            return undefined;
        }
        else if(Object.keys(arg.sort).length === 0) {
            return undefined;
        }
        else if(Object.keys(arg.sort).length > 1 || !arg.sort[0].startsWith("createdOn_")) {
            throw new WebinyError(
                "Unsupported entry sorting.",
                "SEARCH_SORT_UNSUPPORTED",
                {
                    arg
                }
            );
        }
        const sort = arg.sort[0] === "createdOn_ASC" ? 1 : -1;
        return {
            SK: sort,
        };
    }
    
    private getPrimaryKey(id: string): string {
        /**
         * If ID includes # it means it is composed of ID and VERSION.
         * We need ID only so extract it.
         */
        if(id.includes("#")) {
            id = id.split("#").shift();
        }
        return `${this._primaryKey}#${id}`;
    }
    
    private createRevisionId(id: string, version: number): string {
        if(id.includes("#")) {
            id = id.split("#").shift();
        }
        return `${id}#${version}`;
    }
    
    private getSecondaryKeyRevision(version: string | number) {
        if(typeof version === "string") {
            return `REV#${version}`;
        }
        return `REV#${utils.zeroPad(version)}`
    }
    
    private getSecondaryKeyLatest(): string {
        return "L";
    }
    private getSecondaryKeyPublished(): string {
        return "P";
    }
    
}