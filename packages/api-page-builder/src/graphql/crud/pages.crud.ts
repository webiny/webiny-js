import mdbid from "mdbid";
import uniqid from "uniqid";
import trimStart from "lodash/trimStart";
import omit from "lodash/omit";
import get from "lodash/get";
import merge from "lodash/merge";
import DataLoader from "dataloader";
import { NotAuthorizedError } from "@webiny/api-security";
import Error from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { Args as FlushArgs } from "@webiny/api-prerendering-service/flush/types";
import { ContextPlugin } from "@webiny/handler/types";
import getPKPrefix from "./utils/getPKPrefix";
import defaults from "./utils/defaults";
import {
    PageImportExportTaskStatus,
    Page,
    PagesCrud,
    PageSecurityPermission,
    PbContext,
    TYPE
} from "~/types";
import { SearchPublishedPagesPlugin } from "~/plugins/SearchPublishedPagesPlugin";
import { SearchLatestPagesPlugin } from "~/plugins/SearchLatestPagesPlugin";
import createListMeta from "./utils/createListMeta";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import getNormalizedListPagesArgs from "./utils/getNormalizedListPagesArgs";
import executeCallbacks from "./utils/executeCallbacks";
import normalizePath from "./pages/normalizePath";
import { compressContent, extractContent } from "./pages/contentCompression";
import { CreateDataModel, UpdateSettingsModel } from "./pages/models";
import { getESLatestPageData, getESPublishedPageData } from "./pages/esPageData";
import { PagePlugin } from "~/plugins/PagePlugin";
import { invokeHandlerClient } from "~/importPages/client";
import { HandlerArgs as CreateHandlerArgs } from "~/importPages/create";
import { initialStats, zeroPad } from "~/importPages/utils";
import { HandlerArgs as ExportPagesProcessHandlerArgs } from "~/exportPages/process";
import { EXPORT_PAGES_FOLDER_KEY } from "~/exportPages/utils";

const STATUS_CHANGES_REQUESTED = "changesRequested";
const STATUS_REVIEW_REQUESTED = "reviewRequested";
const STATUS_DRAFT = "draft";
const STATUS_PUBLISHED = "published";
const STATUS_UNPUBLISHED = "unpublished";

const getZeroPaddedVersionNumber = number => String(number).padStart(4, "0");

const DEFAULT_EDITOR = "page-builder";
const PERMISSION_NAME = "pb.page";
const EXPORT_PAGES_PROCESS_HANDLER = process.env.EXPORT_PAGES_PROCESS_HANDLER;
const IMPORT_PAGES_CREATE_HANDLER = process.env.IMPORT_PAGES_CREATE_HANDLER;

const plugin: ContextPlugin<PbContext> = {
    type: "context",
    async apply(context) {
        const { db, i18nContent, elasticsearch } = context;

        const PK_PAGE = pid => `${getPKPrefix(context)}P#${pid}`;
        const PK_PAGE_PUBLISHED_PATH = () => `${getPKPrefix(context)}PATH`;
        const ES_DEFAULTS = () => defaults.es(context);

        // Used in a couple of key events - (un)publishing and pages deletion.
        const pagePlugins = context.plugins.byType<PagePlugin>(PagePlugin.type);

        context.pageBuilder = {
            ...context.pageBuilder,
            pages: {
                dataLoaders: {
                    getPublishedById: new DataLoader(
                        async argsArray => {
                            const batch = db.batch();
                            const notFoundError = new NotFoundError("Page not found.");
                            const idNotProvidedError = new Error(
                                'Cannot get published page - "id" not provided.'
                            );

                            const errorsAndResults = [];

                            let batchResultIndex = 0;
                            for (let i = 0; i < argsArray.length; i++) {
                                const args = argsArray[i];

                                if (!args.id) {
                                    errorsAndResults.push(idNotProvidedError);
                                    continue;
                                }

                                // If we have a full ID, then try to load it directly.
                                const [pid, version] = args.id.split("#");

                                if (version) {
                                    errorsAndResults.push(batchResultIndex++);
                                    batch.read({
                                        ...defaults.db,
                                        query: { PK: PK_PAGE(pid), SK: `REV#${version}` }
                                    });
                                    continue;
                                }

                                errorsAndResults.push(batchResultIndex++);
                                batch.read({
                                    ...defaults.db,
                                    query: {
                                        PK: PK_PAGE(pid),
                                        SK: `P`
                                    }
                                });
                            }

                            // Replace batch result indexes with actual results.
                            const batchResults = await batch.execute();
                            for (let i = 0; i < errorsAndResults.length; i++) {
                                const errorResult = errorsAndResults[i];
                                if (typeof errorResult !== "number") {
                                    continue;
                                }

                                const [[page]] = batchResults[errorResult];
                                if (!page) {
                                    errorsAndResults[i] = notFoundError;
                                    continue;
                                }

                                // If preview enabled, return the page, without checking if the page
                                // is published. The preview flag is not utilized anywhere else.
                                if (argsArray[i].preview || page.status === "published") {
                                    errorsAndResults[i] = page;

                                    // Extract compressed page content.
                                    errorsAndResults[i].content = await extractContent(
                                        errorsAndResults[i].content
                                    );

                                    continue;
                                }

                                errorsAndResults[i] = notFoundError;
                            }

                            return errorsAndResults;
                        },
                        {
                            cacheKeyFn: key => key.id + key.preview
                        }
                    )
                },
                async get(id) {
                    const [pid, rev] = id.split("#");
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "r"
                    });

                    let page;
                    if (rev) {
                        const [[exactRevision]] = await db.read<Page>({
                            ...defaults.db,
                            query: { PK: PK_PAGE(pid), SK: `REV#${rev}` }
                        });
                        page = exactRevision;
                    } else {
                        const [[latestRevision]] = await db.read<Page>({
                            ...defaults.db,
                            query: { PK: PK_PAGE(pid), SK: `L` }
                        });
                        page = latestRevision;
                    }

                    if (!page) {
                        throw new NotFoundError("Page not found.");
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    // Extract compressed page content.
                    page.content = await extractContent(page.content);
                    return page;
                },

                async getPublishedById(args) {
                    return this.dataLoaders.getPublishedById.load(args);
                },

                async getPublishedByPath(args) {
                    if (!args.path) {
                        throw new Error('Cannot get published page - "path" not provided.');
                    }

                    const notFoundError = new NotFoundError("Page not found.");

                    const normalizedPath = normalizePath(args.path);
                    if (normalizedPath === "/") {
                        const settings = await context.pageBuilder.settings.default.getCurrent();
                        if (!settings?.pages?.home) {
                            throw notFoundError;
                        }

                        return context.pageBuilder.pages.getPublishedById({
                            id: settings.pages.home
                        });
                    }

                    let [[page]] = await db.read<Page>({
                        ...defaults.db,
                        query: { PK: PK_PAGE_PUBLISHED_PATH(), SK: normalizedPath }
                    });

                    if (!page) {
                        // Try loading dynamic pages
                        for (const plugin of pagePlugins) {
                            if (typeof plugin.notFound === "function") {
                                page = await plugin.notFound({ args, context });
                                if (page) {
                                    break;
                                }
                            }
                        }
                    }

                    if (page) {
                        // Extract compressed page content.
                        page.content = await extractContent(page.content);
                        return page;
                    }

                    throw notFoundError;
                },

                async listLatest(args) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "r"
                    });
                    const { sort, from, size, query, page } = getNormalizedListPagesArgs(
                        args,
                        context
                    );

                    query.filter.push(
                        {
                            term: { "locale.keyword": i18nContent.getLocale().code }
                        },
                        { term: { latest: true } }
                    );

                    // If users can only manage own records, let's add the special filter.
                    if (permission.own === true) {
                        const identity = context.security.getIdentity();
                        query.filter.push({
                            term: { "createdBy.id.keyword": identity.id }
                        });
                    }

                    const listLatestPlugins = context.plugins.byType<SearchLatestPagesPlugin>(
                        SearchLatestPagesPlugin.type
                    );

                    for (const plugin of listLatestPlugins) {
                        // Apply query modifications
                        plugin.modifyQuery({ query, args, context });

                        // Apply sort modifications
                        plugin.modifySort({ sort, args, context });
                    }

                    const response = await elasticsearch.search({
                        ...ES_DEFAULTS(),
                        body: {
                            query: {
                                bool: {
                                    must: query.must.length > 0 ? query.must : undefined,
                                    must_not:
                                        query.must_not.length > 0 ? query.must_not : undefined,
                                    filter: query.filter.length > 0 ? query.filter : undefined
                                }
                            },
                            from,
                            size,
                            sort
                        }
                    });

                    const results = response.body.hits;
                    const total = results.total.value;
                    const data = total > 0 ? results.hits.map(item => item._source) : [];

                    const meta = createListMeta({ page, limit: size, totalCount: total });
                    return [data, meta];
                },

                async listPublished(args) {
                    const { sort, from, size, query, page } = getNormalizedListPagesArgs(
                        args,
                        context
                    );

                    query.filter.push(
                        {
                            term: { "locale.keyword": i18nContent.getLocale().code }
                        },
                        { term: { published: true } }
                    );

                    const listPublishedPlugins = context.plugins.byType<SearchPublishedPagesPlugin>(
                        SearchPublishedPagesPlugin.type
                    );

                    for (const plugin of listPublishedPlugins) {
                        // Apply query modifications
                        plugin.modifyQuery({ query, args, context });

                        // Apply sort modifications
                        plugin.modifySort({ sort, args, context });
                    }

                    const response = await elasticsearch.search({
                        ...ES_DEFAULTS(),
                        body: {
                            query: {
                                bool: {
                                    must: query.must.length > 0 ? query.must : undefined,
                                    must_not:
                                        query.must_not.length > 0 ? query.must_not : undefined,
                                    filter: query.filter.length > 0 ? query.filter : undefined
                                }
                            },
                            from,
                            size,
                            sort
                        }
                    });

                    const results = response.body.hits;
                    const total = results.total.value;
                    const data = total > 0 ? results.hits.map(item => item._source) : [];

                    const meta = createListMeta({ page, limit: size, totalCount: total });
                    return [data, meta];
                },

                async listTags(args) {
                    if (args.search.query.length < 2) {
                        throw new Error("Please provide at least two characters.");
                    }

                    let query = undefined;
                    // When ES index is shared between tenants, we need to filter records by tenant ID
                    const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
                    if (sharedIndex) {
                        const tenant = context.tenancy.getCurrentTenant();
                        query = {
                            bool: {
                                filter: [{ term: { "tenant.keyword": tenant.id } }]
                            }
                        };
                    }

                    const response = await elasticsearch.search({
                        ...ES_DEFAULTS(),
                        body: {
                            query,
                            size: 0,
                            aggs: {
                                tags: {
                                    terms: {
                                        field: "tags.keyword",
                                        include: `.*${args.search.query}.*`,
                                        size: 10
                                    }
                                }
                            }
                        }
                    });

                    try {
                        return response.body.aggregations.tags.buckets.map(item => item.key);
                    } catch {
                        return [];
                    }
                },

                async listPageRevisions(pageId) {
                    const [pid] = pageId.split("#");
                    const [pages] = await db.read<Page>({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE(pid),
                            SK: { $beginsWith: "REV#" },
                            sort: { SK: -1 }
                        }
                    });

                    return pages.sort((a, b) => b.version - a.version);
                },

                async create(categorySlug) {
                    await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

                    const category = await context.pageBuilder.categories.get(categorySlug);
                    if (!category) {
                        throw new NotFoundError(`Category with slug "${categorySlug}" not found.`);
                    }

                    const title = "Untitled";

                    let pagePath = "";
                    if (category.slug === "static") {
                        pagePath = normalizePath("untitled-" + uniqid.time());
                    } else {
                        pagePath = normalizePath(
                            [category.url, "untitled-" + uniqid.time()]
                                .join("/")
                                .replace(/\/\//g, "/")
                        );
                    }

                    const identity = context.security.getIdentity();
                    new CreateDataModel().populate({ category: category.slug }).validate();

                    const [pid, version] = [mdbid(), 1];
                    const zeroPaddedVersion = getZeroPaddedVersionNumber(version);

                    const id = `${pid}#${zeroPaddedVersion}`;

                    const updateSettingsModel = new UpdateSettingsModel().populate({
                        general: {
                            layout: category.layout
                        }
                    });

                    const owner = {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    };

                    const page: Page = {
                        id,
                        pid,
                        locale: context.i18nContent.getLocale().code,
                        tenant: context.tenancy.getCurrentTenant().id,
                        editor: DEFAULT_EDITOR,
                        category: category.slug,
                        title,
                        path: pagePath,
                        version: 1,
                        status: STATUS_DRAFT,
                        visibility: {
                            list: { latest: true, published: true },
                            get: { latest: true, published: true }
                        },
                        home: false,
                        notFound: false,
                        locked: false,
                        publishedOn: null,
                        createdFrom: null,
                        settings: await updateSettingsModel.toJSON(),
                        savedOn: new Date().toISOString(),
                        createdOn: new Date().toISOString(),
                        ownedBy: owner,
                        createdBy: owner,
                        content: compressContent() // Just create the initial { compression, content } object.
                    };

                    await executeCallbacks<PagePlugin["beforeCreate"]>(
                        pagePlugins,
                        "beforeCreate",
                        { context, page }
                    );

                    const ddbData = {
                        PK: PK_PAGE(pid),
                        SK: `REV#${zeroPaddedVersion}`,
                        TYPE: TYPE.PAGE,
                        ...page
                    };

                    const latestPageKeys = { PK: PK_PAGE(pid), SK: "L" };

                    await db
                        .batch()
                        .create({ ...defaults.db, data: ddbData })
                        .create({
                            ...defaults.db,
                            data: { ...ddbData, ...latestPageKeys }
                        })
                        .create({
                            ...defaults.esDb,
                            data: {
                                ...latestPageKeys,
                                index: ES_DEFAULTS().index,
                                data: getESLatestPageData(context, {
                                    ...ddbData,
                                    ...latestPageKeys
                                })
                            }
                        })
                        .execute();

                    await executeCallbacks<PagePlugin["afterCreate"]>(pagePlugins, "afterCreate", {
                        context,
                        page
                    });

                    return omit(ddbData, ["PK", "SK", "content"]) as any;
                },

                async createFrom(from) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "w"
                    });

                    const [fromPid, fromVersion] = from.split("#");

                    const [[[page]], [[latestPage]]] = await db
                        .batch<[[Page]], [[Page]]>()
                        .read({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE(fromPid),
                                SK: `REV#${fromVersion}`
                            }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE(fromPid),
                                SK: "L"
                            }
                        })
                        .execute();

                    if (!page) {
                        throw new NotFoundError(`Page "${from}" not found.`);
                    }

                    // Must not be able to create a new page (revision) from a page of another author.
                    if (permission?.own === true) {
                        const identity = context.security.getIdentity();
                        if (page.ownedBy.id !== identity.id) {
                            throw new NotAuthorizedError();
                        }
                    }

                    const nextVersion = latestPage.version + 1;
                    const zeroPaddedNextVersion = getZeroPaddedVersionNumber(nextVersion);
                    const nextId = `${fromPid}#${zeroPaddedNextVersion}`;
                    const identity = context.security.getIdentity();

                    const data: Record<string, any> = {
                        ...page,
                        SK: `REV#${zeroPaddedNextVersion}`,
                        id: nextId,
                        status: STATUS_DRAFT,
                        locked: false,
                        publishedOn: null,
                        version: nextVersion,
                        savedOn: new Date().toISOString(),
                        createdFrom: from,
                        createdOn: new Date().toISOString(),
                        createdBy: {
                            id: identity.id,
                            displayName: identity.displayName,
                            type: identity.type
                        }
                    };

                    await executeCallbacks<PagePlugin["beforeCreate"]>(
                        pagePlugins,
                        "beforeCreate",
                        {
                            context,
                            page: data as Page
                        }
                    );

                    const latestPageKeys = {
                        PK: PK_PAGE(fromPid),
                        SK: "L"
                    };

                    const batch = db
                        .batch()
                        .create({ ...defaults.db, data })
                        .update({
                            ...defaults.db,
                            query: latestPageKeys,
                            data: {
                                ...data,
                                ...latestPageKeys
                            }
                        });

                    // If the new revision is visible in "latest" page lists, then update the ES index.
                    if (get(data, "visibility.list.latest") !== false) {
                        batch.update({
                            ...defaults.esDb,
                            query: latestPageKeys,
                            data: {
                                ...latestPageKeys,
                                index: ES_DEFAULTS().index,
                                data: getESLatestPageData(context, data as Page)
                            }
                        });
                    }

                    await batch.execute();

                    await executeCallbacks<PagePlugin["afterCreate"]>(pagePlugins, "afterCreate", {
                        page: data as Page,
                        context
                    });

                    // Extract compressed page content.
                    data.content = await extractContent(data.content);

                    return data as Page;
                },

                async update(id, data) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "w"
                    });

                    const [pid, rev] = id.split("#");

                    const [[[existingPage]], [[existingLatestPage]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE(pid), SK: `REV#${rev}` },
                            limit: 1
                        })
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE(pid), SK: "L" },
                            limit: 1
                        })
                        .execute();

                    if (!existingPage) {
                        throw new NotFoundError(`Page "${id}" not found.`);
                    }

                    if (existingPage.locked) {
                        throw new Error(`Cannot update page because it's locked.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, existingPage, "ownedBy");

                    const updateData: Partial<Page> = {
                        ...data,
                        savedOn: new Date().toISOString()
                    };

                    await executeCallbacks<PagePlugin["beforeUpdate"]>(
                        pagePlugins,
                        "beforeUpdate",
                        {
                            context,
                            existingPage,
                            inputData: data,
                            updateData
                        }
                    );

                    const newContent = updateData.content;
                    if (newContent) {
                        updateData.content = compressContent(newContent);
                    }

                    const newPageData = { ...existingPage, ...updateData };
                    const newLatestPage = { ...existingLatestPage, ...updateData };

                    const batch = db.batch().update({
                        ...defaults.db,
                        query: { PK: PK_PAGE(pid), SK: `REV#${rev}` },
                        data: newPageData
                    });

                    // If we updated the latest rev, make sure the changes are propagated to "L" record and ES.
                    if (newLatestPage.id === id) {
                        const latestPageKeys = { PK: PK_PAGE(pid), SK: "L" };

                        batch.update({
                            ...defaults.db,
                            query: latestPageKeys,
                            data: newLatestPage
                        });

                        // Update the ES index according to the value of the "latest pages lists" visibility setting.
                        if (get(newPageData, "visibility.list.latest") !== false) {
                            batch.update({
                                ...defaults.esDb,
                                query: latestPageKeys,
                                data: {
                                    ...latestPageKeys,
                                    index: ES_DEFAULTS().index,
                                    data: getESLatestPageData(context, newPageData)
                                }
                            });
                        } else {
                            batch.delete({
                                ...defaults.esDb,
                                query: latestPageKeys
                            });
                        }
                    }

                    await batch.execute();

                    await executeCallbacks<PagePlugin["afterUpdate"]>(pagePlugins, "afterUpdate", {
                        context,
                        page: newPageData as Page,
                        inputData: data
                    });

                    return {
                        ...newPageData,
                        content: newContent || newPageData.content
                    };
                },

                async delete(pageId) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "d"
                    });

                    const [pid, rev] = pageId.split("#");
                    const PAGE_PK = PK_PAGE(pid);

                    // 1. Load the page and latest / published page (rev) data.
                    const [[[page]], [[latestPage]], [[publishedPage]]] = await db
                        .batch<[[Page]], [[Page]], [[Page]]>()
                        .read({
                            ...defaults.db,
                            query: { PK: PAGE_PK, SK: `REV#${rev}` }
                        })
                        .read({
                            ...defaults.db,
                            query: { PK: PAGE_PK, SK: "L" }
                        })
                        .read({
                            ...defaults.db,
                            query: { PK: PAGE_PK, SK: "P" }
                        })
                        .execute();

                    // 2. Do a couple of checks.
                    if (!page) {
                        throw new NotFoundError(`Page "${pageId}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    const settings = await context.pageBuilder.settings.default.getCurrent();
                    const pages = settings?.pages || {};
                    for (const key in pages) {
                        if (pages[key] === page.pid) {
                            throw new Error(`Cannot delete page because it's set as ${key}.`);
                        }
                    }

                    // 3. Let's start updating. But first, let's trigger before-delete hook callbacks.
                    await executeCallbacks<PagePlugin["beforeDelete"]>(
                        pagePlugins,
                        "beforeDelete",
                        {
                            context,
                            page,
                            latestPage,
                            publishedPage
                        }
                    );

                    // Before we continue, note that if `publishedPageData` exists, then `publishedPagePathData`
                    // also exists. And to delete it, we can read `publishedPageData.path` to get its SK.
                    // There can't be a situation where just one record exists, there's always gonna be both.

                    // If we are deleting the initial version, we need to remove all versions and all of the meta data.
                    if (page.version === 1) {
                        // 4.1. We delete pages in batches of 15.
                        let publishedPathEntryDeleted = false;
                        while (true) {
                            const [pageItemCollection] = await db.read({
                                ...defaults.db,
                                limit: 15,
                                query: { PK: PAGE_PK, SK: { $gte: " " } }
                            });

                            if (pageItemCollection.length === 0) {
                                break;
                            }

                            const batch = db.batch();
                            for (let i = 0; i < pageItemCollection.length; i++) {
                                const item = pageItemCollection[i];
                                if (item.status === "published" && !publishedPathEntryDeleted) {
                                    publishedPathEntryDeleted = true;
                                    batch.delete({
                                        ...defaults.db,
                                        query: { PK: PK_PAGE_PUBLISHED_PATH(), SK: item.path }
                                    });
                                }

                                batch.delete({
                                    ...defaults.db,
                                    query: { PK: item.PK, SK: item.SK }
                                });
                            }

                            await batch.execute();
                        }

                        // 4.2. Finally, delete data from ES.
                        await db
                            .batch()
                            .delete({
                                ...defaults.esDb,
                                query: {
                                    PK: PAGE_PK,
                                    SK: "L"
                                }
                            })
                            .delete({
                                ...defaults.esDb,
                                query: {
                                    PK: PAGE_PK,
                                    SK: "P"
                                }
                            })
                            .execute();

                        await executeCallbacks<PagePlugin["afterDelete"]>(
                            pagePlugins,
                            "afterDelete",
                            {
                                context,
                                page,
                                latestPage,
                                publishedPage
                            }
                        );

                        return [page, null];
                    }

                    // 5. If we are deleting a specific version (version > 1)...

                    // 6.1. Delete the actual page entry.
                    const batch = db.batch().delete({
                        ...defaults.db,
                        query: { PK: PAGE_PK, SK: `REV#${rev}` }
                    });

                    // 6.2. If the page is published, remove published data, both from DB and ES.
                    if (publishedPage && publishedPage.id === page.id) {
                        batch
                            .delete({
                                ...defaults.db,
                                query: {
                                    PK: PAGE_PK,
                                    SK: "P"
                                }
                            })
                            .delete({
                                ...defaults.db,
                                query: {
                                    PK: PK_PAGE_PUBLISHED_PATH(),
                                    SK: publishedPage.path
                                }
                            })
                            .delete({
                                ...defaults.esDb,
                                query: {
                                    PK: PAGE_PK,
                                    SK: "P"
                                }
                            });
                    }

                    // 6.3. If the page is latest, assign the previously latest page as the new latest.
                    // Updates must be made again both on DB and ES side.
                    let newLatestPage;
                    if (latestPage.id === page.id) {
                        [[newLatestPage]] = await db.read({
                            ...defaults.db,
                            query: { PK: PAGE_PK, SK: { $lt: `REV#${rev}` } },
                            sort: { SK: -1 },
                            limit: 1
                        });

                        // Update latest page data.
                        batch
                            .update({
                                ...defaults.db,
                                query: {
                                    PK: PAGE_PK,
                                    SK: "L"
                                },
                                data: {
                                    ...newLatestPage,
                                    PK: PAGE_PK,
                                    SK: "L"
                                }
                            })
                            .update({
                                ...defaults.esDb,
                                query: {
                                    PK: PAGE_PK,
                                    SK: "L"
                                },
                                data: {
                                    PK: PAGE_PK,
                                    SK: "L",
                                    index: ES_DEFAULTS().index,
                                    data: getESLatestPageData(context, newLatestPage)
                                }
                            });
                    }

                    await batch.execute();

                    await executeCallbacks<PagePlugin["afterDelete"]>(pagePlugins, "afterDelete", {
                        context,
                        page,
                        latestPage,
                        publishedPage
                    });

                    // 7. Done. We return both the deleted page, and the new latest one (if there is one).
                    return [page, newLatestPage];
                },

                async publish(pageId: string) {
                    const permission = await checkBasePermissions<PageSecurityPermission>(
                        context,
                        PERMISSION_NAME,
                        {
                            pw: "p"
                        }
                    );

                    const [pid, rev] = pageId.split("#");
                    const PAGE_PK = PK_PAGE(pid);

                    // `publishedPageData` will give us a record that contains `id` and `path, which tell us
                    // the current revision and over which path it has been published, respectively.
                    const [[[page]], [[publishedPage]], [[latestPage]]] = await db
                        .batch<[[Page]], [[Page]], [[Page]]>()
                        .read({
                            ...defaults.db,
                            query: { PK: PAGE_PK, SK: `REV#${rev}` }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: PAGE_PK,
                                SK: "P"
                            }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: PAGE_PK,
                                SK: "L"
                            }
                        })
                        .execute();

                    if (!page) {
                        throw new NotFoundError(`Page "${pageId}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    if (page.status === STATUS_PUBLISHED) {
                        throw new NotFoundError(`Page "${pageId}" is already published.`);
                    }

                    const [[publishedPageOnPath]] = await db.read<Page>({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE_PUBLISHED_PATH(),
                            SK: page.path
                        }
                    });

                    await executeCallbacks<PagePlugin["beforePublish"]>(
                        pagePlugins,
                        "beforePublish",
                        {
                            context,
                            page,
                            latestPage,
                            publishedPage
                        }
                    );

                    const pathTakenByAnotherPage =
                        publishedPageOnPath && publishedPageOnPath.pid !== page.pid;

                    // If this is true, let's unpublish the page first. Note that we're not talking about this
                    // same page, but a previous revision. We're talking about a completely different page
                    // (with different PID). Remember that page ID equals `PID#version`.
                    if (pathTakenByAnotherPage) {
                        // Note two things here...
                        // 1) It is possible that this call is about to try to unpublish a page that is set as
                        // a special page (home / 404). In that case, this whole process will fail, and that
                        // is to be expected. Maybe we could think of a better solution in the future, but for
                        // now, it works like this. If there was only more ⏱.
                        // 2) If a user doesn't have the unpublish permission, again, the whole action will fail.
                        await this.unpublish(publishedPageOnPath.id);
                    }

                    // Now that the other page has been unpublished, we can continue with publish the current one.

                    // Change loaded page's status to published.
                    page.status = STATUS_PUBLISHED;
                    page.locked = true;
                    page.publishedOn = new Date().toISOString();

                    // We need to issue a couple of updates.
                    const batch = db.batch();

                    // 1. Update the page in the database first.
                    batch.update({
                        ...defaults.db,
                        query: {
                            PK: PAGE_PK,
                            SK: `REV#${rev}`
                        },
                        data: page
                    });

                    // If we just published the latest version, update the latest revision entry too.
                    if (latestPage.id === pageId) {
                        batch.update({
                            ...defaults.db,
                            query: {
                                PK: PAGE_PK,
                                SK: "L"
                            },
                            data: { ...page, PK: PAGE_PK, SK: "L" }
                        });
                    }

                    if (publishedPage) {
                        const [, publishedRev] = publishedPage.id.split("#");
                        batch
                            .update({
                                ...defaults.db,
                                query: {
                                    PK: PAGE_PK,
                                    SK: `REV#${publishedRev}`
                                },
                                data: {
                                    ...publishedPage,
                                    status: STATUS_UNPUBLISHED,
                                    PK: PAGE_PK,
                                    SK: `REV#${publishedRev}`
                                }
                            })
                            .update({
                                ...defaults.db,
                                query: {
                                    PK: PAGE_PK,
                                    SK: "P"
                                },
                                data: { ...page, PK: PAGE_PK, SK: "P" }
                            });

                        // If the paths are different, delete previous published-page-on-path entry.
                        if (publishedPage.path !== page.path) {
                            batch
                                .delete({
                                    ...defaults.db,
                                    query: {
                                        PK: PK_PAGE_PUBLISHED_PATH(),
                                        SK: publishedPage.path
                                    }
                                })
                                .create({
                                    ...defaults.db,
                                    data: {
                                        ...page,
                                        PK: PK_PAGE_PUBLISHED_PATH(),
                                        SK: page.path
                                    }
                                });
                        } else {
                            batch.update({
                                ...defaults.db,
                                query: {
                                    PK: PK_PAGE_PUBLISHED_PATH(),
                                    SK: page.path
                                },
                                data: {
                                    ...page,
                                    PK: PK_PAGE_PUBLISHED_PATH(),
                                    SK: page.path
                                }
                            });
                        }
                    } else {
                        batch
                            .create({
                                ...defaults.db,
                                data: {
                                    ...page,
                                    PK: PAGE_PK,
                                    SK: "P"
                                }
                            })
                            .create({
                                ...defaults.db,
                                data: {
                                    ...page,
                                    PK: PK_PAGE_PUBLISHED_PATH(),
                                    SK: page.path
                                }
                            });
                    }

                    // If we are publishing the latest revision, let's also update the latest revision entry's
                    // status in ES. Also, if we are publishing the latest revision and the "LATEST page lists
                    // visibility" is not false, then we need to update the latest page revision entry in ES.
                    if (
                        latestPage?.id === pageId &&
                        get(page, "visibility.list.latest") !== false
                    ) {
                        batch.update({
                            ...defaults.esDb,
                            query: {
                                PK: PAGE_PK,
                                SK: "L"
                            },
                            data: {
                                PK: PAGE_PK,
                                SK: "L",
                                index: ES_DEFAULTS().index,
                                data: getESLatestPageData(context, page)
                            }
                        });
                    }

                    // Update the published revision entry in ES,
                    // if the "PUBLISHED page lists visibility" setting is not explicitly set to false.
                    if (get(page, "visibility.list.published") !== false) {
                        batch.create({
                            ...defaults.esDb,
                            data: {
                                PK: PAGE_PK,
                                SK: "P",
                                index: ES_DEFAULTS().index,
                                data: getESPublishedPageData(context, {
                                    ...page,
                                    id: pageId,
                                    status: STATUS_PUBLISHED,
                                    locked: true
                                })
                            }
                        });
                    } else {
                        batch.delete({
                            ...defaults.esDb,
                            query: {
                                PK: PAGE_PK,
                                SK: "P"
                            }
                        });
                    }

                    await batch.execute();

                    await executeCallbacks<PagePlugin["afterPublish"]>(
                        pagePlugins,
                        "afterPublish",
                        {
                            context,
                            page,
                            latestPage,
                            publishedPage
                        }
                    );

                    return page;
                },

                async unpublish(pageId: string) {
                    const permission = await checkBasePermissions<PageSecurityPermission>(
                        context,
                        PERMISSION_NAME,
                        {
                            pw: "u"
                        }
                    );

                    const [pid, rev] = pageId.split("#");
                    const PAGE_PK = PK_PAGE(pid);

                    const [[[page]], [[publishedPage]], [[latestPage]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PAGE_PK, SK: `REV#${rev}` },
                            limit: 1
                        })
                        .read({
                            ...defaults.db,
                            limit: 1,
                            query: {
                                PK: PAGE_PK,
                                SK: "P"
                            }
                        })
                        .read({
                            ...defaults.db,
                            limit: 1,
                            query: {
                                PK: PAGE_PK,
                                SK: "L"
                            }
                        })
                        .execute();

                    if (!page) {
                        throw new NotFoundError(`Page "${pageId}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    if (!publishedPage || publishedPage.id !== pageId) {
                        throw new Error(`Page "${pageId}" is not published.`);
                    }

                    const settings = await context.pageBuilder.settings.default.getCurrent();
                    const pages = settings?.pages || {};
                    for (const key in pages) {
                        if (pages[key] === page.pid) {
                            throw new Error(`Cannot unpublish page because it's set as ${key}.`);
                        }
                    }

                    await executeCallbacks<PagePlugin["beforeUnpublish"]>(
                        pagePlugins,
                        "beforeUnpublish",
                        {
                            context,
                            page
                        }
                    );

                    page.status = STATUS_UNPUBLISHED;

                    const batch = db
                        .batch()
                        .delete({
                            ...defaults.db,
                            query: {
                                PK: PAGE_PK,
                                SK: "P"
                            }
                        })
                        .delete({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE_PUBLISHED_PATH(),
                                SK: publishedPage.path
                            }
                        })
                        .update({
                            ...defaults.db,
                            query: {
                                PK: PAGE_PK,
                                SK: `REV#${rev}`
                            },
                            data: page
                        });

                    // If we are unpublishing the latest revision, let's also update the latest revision entry's
                    // status in ES. We can only do that if the entry actually exists, or in other words, if the
                    // published page's "LATEST pages lists visibility" setting is not set to false.
                    if (latestPage.id === pageId && get(page, "visibility.list.latest") !== false) {
                        batch.update({
                            ...defaults.esDb,
                            query: {
                                PK: PAGE_PK,
                                SK: "L"
                            },
                            data: {
                                PK: PAGE_PK,
                                SK: "L",
                                index: ES_DEFAULTS().index,
                                data: getESLatestPageData(context, page)
                            }
                        });
                    }

                    // And of course, delete the published revision entry in ES.
                    if (get(page, "visibility.list.published") !== false) {
                        batch.delete({
                            ...defaults.esDb,
                            query: {
                                PK: PAGE_PK,
                                SK: "P"
                            }
                        });
                    }

                    await batch.execute();

                    await executeCallbacks<PagePlugin["afterUnpublish"]>(
                        pagePlugins,
                        "afterUnpublish",
                        {
                            context,
                            page
                        }
                    );

                    return page;
                },

                async requestReview(pageId: string) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        pw: "r"
                    });

                    const [pid, rev] = pageId.split("#");
                    const PAGE_PK = PK_PAGE(pid);

                    const [[[page]], [[latestPageData]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PAGE_PK, SK: `REV#${rev}` }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: PAGE_PK,
                                SK: "L"
                            }
                        })
                        .execute();

                    if (!page) {
                        throw new NotFoundError(`Page "${pageId}" not found.`);
                    }

                    const allowedStatuses = [STATUS_DRAFT, STATUS_CHANGES_REQUESTED];
                    if (!allowedStatuses.includes(page.status)) {
                        throw new Error(
                            `Cannot request review - page is not a draft nor a change request has been issued.`
                        );
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    // Change loaded page's status to `reviewRequested`.
                    page.status = STATUS_REVIEW_REQUESTED;
                    page.locked = true;

                    const batch = db.batch().update({
                        ...defaults.db,
                        query: {
                            PK: PAGE_PK,
                            SK: `REV#${rev}`
                        },
                        data: page
                    });

                    // If we updated the latest version, then make sure the changes are propagated to ES too.
                    if (latestPageData.id === pageId) {
                        // 0nly update if the "LATEST pages lists visibility" is not set to false.
                        if (get(page, "visibility.list.latest") !== false) {
                            batch.update({
                                ...defaults.esDb,
                                query: {
                                    PK: PAGE_PK,
                                    SK: "L"
                                },
                                data: {
                                    PK: PAGE_PK,
                                    SK: "L",
                                    index: ES_DEFAULTS().index,
                                    data: getESLatestPageData(context, page)
                                }
                            });
                        }
                    }

                    await batch.execute();

                    return page;
                },

                async requestChanges(pageId: string) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        pw: "c"
                    });

                    const [pid, rev] = pageId.split("#");
                    const PAGE_PK = PK_PAGE(pid);

                    const [[[page]], [[latestPageData]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PAGE_PK, SK: `REV#${rev}` }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: PAGE_PK,
                                SK: "L"
                            }
                        })
                        .execute();

                    if (!page) {
                        throw new NotFoundError(`Page "${pageId}" not found.`);
                    }

                    if (page.status !== STATUS_REVIEW_REQUESTED) {
                        throw new Error(
                            `Cannot request changes on a page that's not under review.`,
                            "REQUESTED_CHANGES_ON_PAGE_REVISION_NOT_UNDER_REVIEW"
                        );
                    }

                    const identity = context.security.getIdentity();
                    if (page.createdBy.id === identity.id) {
                        throw new Error(
                            "Cannot request changes on page revision you created.",
                            "REQUESTED_CHANGES_ON_PAGE_REVISION_YOU_CREATED"
                        );
                    }

                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    // Change loaded page's status to published.
                    page.status = STATUS_CHANGES_REQUESTED;
                    page.locked = false;

                    const batch = await db.batch().update({
                        ...defaults.db,
                        query: {
                            PK: PAGE_PK,
                            SK: `REV#${rev}`
                        },
                        data: page
                    });

                    // If we updated the latest version, then make sure the changes are propagated to ES too.
                    if (latestPageData.id === pageId) {
                        // Only update if the "LATEST pages lists visibility" is not set to false.
                        if (get(page, "visibility.list.latest") !== false) {
                            batch.update({
                                ...defaults.esDb,
                                query: {
                                    PK: PAGE_PK,
                                    SK: "L"
                                },
                                data: {
                                    PK: PAGE_PK,
                                    SK: "L",
                                    index: ES_DEFAULTS().index,
                                    data: getESLatestPageData(context, page)
                                }
                            });
                        }
                    }

                    await batch.execute();

                    return page;
                },

                async importPages(
                    categorySlug: string,
                    data: {
                        zipFileKey?: string;
                        zipFileUrl?: string;
                    }
                ) {
                    await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "w"
                    });

                    // Bail out early if category not found
                    const category = await context.pageBuilder.categories.get(categorySlug);
                    if (!category) {
                        throw new NotFoundError(`Category with slug "${categorySlug}" not found.`);
                    }

                    // Create a task for import page
                    const task = await context.pageBuilder.pageImportExportTask.create({
                        status: PageImportExportTaskStatus.PENDING,
                        input: {
                            category: categorySlug,
                            data
                        }
                    });

                    await invokeHandlerClient<CreateHandlerArgs>({
                        context,
                        name: IMPORT_PAGES_CREATE_HANDLER,
                        payload: {
                            category: categorySlug,
                            data,
                            task
                        }
                    });

                    return {
                        task
                    };
                },

                async exportPages(pageIds: string[], revisionType) {
                    await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "w"
                    });
                    if (pageIds.length === 0) {
                        throw new Error(
                            "Cannot export page(s) - no page ID(s) were provided.",
                            "EMPTY_PAGE_IDS_PROVIDED"
                        );
                    }

                    // Create the main task for page export.
                    const task = await context.pageBuilder.pageImportExportTask.create({
                        status: PageImportExportTaskStatus.PENDING
                    });
                    const exportPagesDataKey = `${EXPORT_PAGES_FOLDER_KEY}/${task.id}`;
                    // For each page create a sub task and invoke the process handler.
                    for (let i = 0; i < pageIds.length; i++) {
                        const pageId = pageIds[i];
                        // Create sub task.
                        await context.pageBuilder.pageImportExportTask.createSubTask(
                            task.id,
                            zeroPad(i + 1),
                            {
                                status: PageImportExportTaskStatus.PENDING,
                                input: {
                                    pageId,
                                    exportPagesDataKey,
                                    revisionType
                                }
                            }
                        );
                    }
                    // Update main task status.
                    await context.pageBuilder.pageImportExportTask.update(task.id, {
                        status: PageImportExportTaskStatus.PROCESSING,
                        stats: initialStats(pageIds.length),
                        input: {
                            exportPagesDataKey,
                            revisionType
                        }
                    });

                    // Invoke handler.
                    await invokeHandlerClient<ExportPagesProcessHandlerArgs>({
                        context,
                        name: EXPORT_PAGES_PROCESS_HANDLER,
                        payload: {
                            taskId: task.id,
                            subTaskIndex: 1
                        }
                    });

                    return { task };
                },

                prerendering: {
                    async render(args) {
                        const current = await context.pageBuilder.settings.default.getCurrent();
                        const appUrl = get(current, "prerendering.app.url");
                        const storageName = get(current, "prerendering.storage.name");

                        if (!appUrl || !storageName) {
                            return;
                        }

                        const meta = merge(current?.prerendering?.meta, {
                            tenant: context.tenancy.getCurrentTenant().id,
                            locale: i18nContent.getLocale().code
                        });

                        const { paths, tags } = args;

                        const dbNamespace = "T#" + context.tenancy.getCurrentTenant().id;

                        if (Array.isArray(paths)) {
                            await context.prerenderingServiceClient.render(
                                paths.map(item => ({
                                    url: appUrl + item.path,
                                    configuration: merge(
                                        {
                                            meta,
                                            storage: {
                                                folder: trimStart(item.path, "/"),
                                                name: storageName
                                            },
                                            db: {
                                                namespace: dbNamespace
                                            }
                                        },
                                        item.configuration
                                    )
                                }))
                            );
                        }

                        if (Array.isArray(tags)) {
                            await context.prerenderingServiceClient.queue.add(
                                tags.map(item => ({
                                    render: {
                                        tag: item.tag,
                                        configuration: merge(
                                            {
                                                db: {
                                                    namespace: dbNamespace
                                                }
                                            },
                                            item.configuration
                                        )
                                    }
                                }))
                            );
                        }
                    },
                    async flush(args) {
                        const current = await context.pageBuilder.settings.default.getCurrent();
                        const appUrl = get(current, "prerendering.app.url");
                        const storageName = get(current, "prerendering.storage.name");

                        if (!storageName) {
                            return;
                        }

                        const { paths, tags } = args;

                        const dbNamespace = "T#" + context.tenancy.getCurrentTenant().id;

                        if (Array.isArray(paths)) {
                            await context.prerenderingServiceClient.flush(
                                paths.map<FlushArgs>(p => ({
                                    url: appUrl + p.path,
                                    // Configuration is mainly static (defined here), but some configuration
                                    // overrides can arrive via the call args, so let's do a merge here.
                                    configuration: merge(
                                        {
                                            db: {
                                                namespace: dbNamespace
                                            }
                                        },
                                        p.configuration
                                    )
                                }))
                            );
                        }

                        if (Array.isArray(tags)) {
                            await context.prerenderingServiceClient.queue.add(
                                tags.map(item => ({
                                    flush: {
                                        tag: item.tag,
                                        configuration: merge(
                                            {
                                                db: {
                                                    namespace: dbNamespace
                                                }
                                            },
                                            item.configuration
                                        )
                                    }
                                }))
                            );
                        }
                    }
                }
            } as PagesCrud
        };
    }
};

export default plugin;
