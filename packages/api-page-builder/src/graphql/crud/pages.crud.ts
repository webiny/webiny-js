import { ContextPlugin } from "@webiny/handler/types";
import mdbid from "mdbid";
import { withFields, string, fields } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import defaults from "./utils/defaults";
import uniqid from "uniqid";
import { NotAuthorizedError } from "@webiny/api-security";
import Error from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import getNormalizedListPagesArgs from "./utils/getNormalizedListPagesArgs";
import omit from "@ramda/omit";
import getPKPrefix from "./utils/getPKPrefix";
import { PageHookPlugin, PbContext, Page, Configuration } from "@webiny/api-page-builder/types";
import createListMeta from "./utils/createListMeta";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import executeHookCallbacks from "./utils/executeHookCallbacks";

const STATUS_CHANGES_REQUESTED = "changesRequested";
const STATUS_REVIEW_REQUESTED = "reviewRequested";
const STATUS_DRAFT = "draft";
const STATUS_PUBLISHED = "published";
const STATUS_UNPUBLISHED = "unpublished";

const DEFAULT_EDITOR = "page-builder";

const CreateDataModel = withFields({
    category: string({ validation: validation.create("required,maxLength:100") })
})();

const UpdateDataModel = withFields({
    title: string({
        validation: validation.create("maxLength:150")
    }),
    url: string({
        validation: value => {
            if (value) {
                validation.validateSync(value, "maxLength:100");
                if (!value.startsWith("/")) {
                    throw new Error('Page path must start with forward slash ("/").');
                }
            }
        }
    }),
    category: string({ validation: validation.create("maxLength:100") }),
    content: object()
})();

const getZeroPaddedVersionNumber = number => String(number).padStart(4, "0");

type PagePublished = {
    PK: string;
    SK: string;
    id: string;
};

type PagePublishedUrl = {
    PK: string;
    SK: string;
    url: string;
    id: string;
};

const UpdateSettingsModel = withFields({
    general: fields({
        value: {},
        instanceOf: withFields({
            tags: string({
                list: true,
                validation: value => {
                    if (!Array.isArray(value)) {
                        return;
                    }

                    if (value.length > 30) {
                        throw new Error("Cannot store more than 30 tags.");
                    }

                    for (let i = 0; i < value.length; i++) {
                        validation.validateSync(value[i], "maxLength:50");
                    }
                }
            }),
            snippet: string({ validation: validation.create("maxLength:500") }),
            layout: string({ validation: validation.create("maxLength:50") }),
            image: object()
        })()
    }),
    seo: fields({
        value: {},
        instanceOf: withFields({
            title: string({ validation: validation.create("maxLength:500") }),
            description: string({ validation: validation.create("maxLength:500") }),
            meta: fields({
                list: true,
                value: [],
                validation: value => {
                    if (!Array.isArray(value)) {
                        return;
                    }

                    if (value.length > 30) {
                        throw new Error("Cannot store more than 30 SEO tags.");
                    }
                    for (let i = 0; i < value.length; i++) {
                        validation.validateSync(value[i], "maxLength:50");
                    }
                },
                instanceOf: withFields({
                    name: string({ validation: validation.create("maxLength:100") }),
                    content: string({ validation: validation.create("maxLength:200") })
                })()
            })
        })()
    }),
    social: fields({
        value: {},
        instanceOf: withFields({
            meta: fields({
                value: [],
                list: true,
                validation: value => {
                    if (!Array.isArray(value)) {
                        return;
                    }

                    if (value.length > 30) {
                        throw new Error("Cannot store more than 30 social tags.");
                    }
                    for (let i = 0; i < value.length; i++) {
                        validation.validateSync(value[i], "maxLength:50");
                    }
                },
                instanceOf: withFields({
                    property: string({ validation: validation.create("maxLength:100") }),
                    content: string({ validation: validation.create("maxLength:200") })
                })()
            }),
            title: string({ validation: validation.create("maxLength:500") }),
            description: string({ validation: validation.create("maxLength:500") }),
            image: object()
        })()
    })
})();

const TYPE_PAGE = "pb.page";
const TYPE_PAGE_LATEST = TYPE_PAGE + ".l";
const TYPE_PAGE_PUBLISHED = TYPE_PAGE + ".p";
const TYPE_PAGE_PUBLISHED_URL = TYPE_PAGE + ".p.url";

const PERMISSION_NAME = TYPE_PAGE;

const getESPageData = (context: PbContext, page) => {
    return {
        __type: "page",
        id: page.id,
        editor: page.editor,
        locale: page.locale,
        tenant: page.tenant,
        createdOn: page.createdOn,
        savedOn: page.savedOn,
        createdBy: page.createdBy,
        ownedBy: page.ownedBy,
        category: page.category,
        version: page.version,
        title: page.title,
        titleLC: page.title.toLowerCase(),
        url: page.url,
        status: page.status,
        locked: page.locked,
        publishedOn: page.publishedOn,
        home: page.home || false,
        error: page.error || false,
        notFound: page.notFound || false,

        // Pull tags & snippet from settings.general.
        tags: page?.settings?.general?.tags || [],
        snippet: page?.settings?.general?.snippet || null,

        // Save some images that could maybe be used on listing pages.
        images: {
            general: page?.settings?.general?.image
        }
    };
};

const getESLatestPageData = (context: PbContext, page) => {
    return { ...getESPageData(context, page), latest: true };
};

const getESPublishedPageData = (context: PbContext, page) => {
    return { ...getESPageData(context, page), published: true };
};

const getESUpdateLatestPageData = updateData => {
    return {
        tags: updateData?.settings?.general?.tags || [],
        snippet: updateData?.settings?.general?.snippet || null,
        title: updateData.title,
        titleLC: updateData?.title?.toLowerCase(),
        url: updateData.url,
        savedOn: updateData.savedOn,

        // Save some images that could maybe be used on listing pages.
        images: {
            general: updateData?.settings?.general?.image
        }
    };
};

const createPlugin = ({ renderingFunction }: Configuration): ContextPlugin<PbContext> => ({
    type: "context",
    apply(context) {
        const { db, i18nContent, elasticSearch } = context;

        const PK_PAGE = () => `${getPKPrefix(context)}P`;
        const PK_PAGE_LATEST = () => PK_PAGE() + "#L";
        const PK_PAGE_PUBLISHED = () => PK_PAGE() + "#P";
        const PK_PAGE_PUBLISHED_URL = () => PK_PAGE_PUBLISHED() + "#URL";
        const ES_DEFAULTS = () => defaults.es(context);

        // Used in a couple of key events - (un)publishing and pages deletion.
        const hookPlugins = context.plugins.byType<PageHookPlugin>("pb-page-hooks");

        context.pageBuilder = {
            ...context.pageBuilder,
            pages: {
                async get(id) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "r"
                    });
                    const [[page]] = await db.read<Page>({
                        ...defaults.db,
                        query: { PK: PK_PAGE(), SK: id },
                        limit: 1
                    });

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    return page;
                },

                async listLatest(args) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "r"
                    });
                    const { sort, from, size, query, page } = getNormalizedListPagesArgs(args);

                    query.bool.filter.push(
                        {
                            term: { "locale.keyword": i18nContent.getLocale().code }
                        },
                        { term: { latest: true } }
                    );

                    // If users can only manage own records, let's add the special filter.
                    if (permission.own === true) {
                        const identity = context.security.getIdentity();
                        query.bool.filter.push({ term: { "createdBy.id.keyword": identity.id } });
                    }

                    const response = await elasticSearch.search({
                        ...ES_DEFAULTS(),
                        body: {
                            query,
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
                    const { sort, from, size, query, page } = getNormalizedListPagesArgs(args);

                    query.bool.filter.push(
                        {
                            term: { "locale.keyword": i18nContent.getLocale().code }
                        },
                        { term: { published: true } }
                    );

                    const response = await elasticSearch.search({
                        ...ES_DEFAULTS(),
                        body: {
                            query,
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

                    const response = await elasticSearch.search({
                        ...ES_DEFAULTS(),
                        body: {
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
                    const [pageIdWithoutVersion] = pageId.split("#");
                    const [pages] = await db.read<Page>({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE(),
                            SK: { $beginsWith: pageIdWithoutVersion },
                            sort: { SK: -1 }
                        }
                    });

                    return pages;
                },

                async getPublished(args) {
                    if (!args.id && !args.url) {
                        throw new Error(
                            'Cannot get published page - must specify either "id" or "url".'
                        );
                    }

                    const notFoundError = new NotFoundError("Page not found.");

                    // 1. If we received `args.id`, then...
                    if (args.id) {
                        // If we have a full ID, then try to load it directly.
                        const [uniquePageId, version] = args.id.split("#");
                        if (version) {
                            const [[page]] = await db.read<Page>({
                                ...defaults.db,
                                query: { PK: PK_PAGE(), SK: args.id },
                                limit: 1
                            });

                            if (page || page.status === "published") {
                                return page;
                            }
                            throw notFoundError;
                        }

                        // If we only have unique page ID (previously know as `parent`),
                        // then let's find out which version is published.
                        const [[pagePublished]] = await db.read<PagePublished>({
                            ...defaults.db,
                            query: { PK: PK_PAGE_PUBLISHED(), SK: uniquePageId },
                            limit: 1
                        });

                        if (!pagePublished) {
                            throw notFoundError;
                        }

                        const [[page]] = await db.read<Page>({
                            ...defaults.db,
                            query: { PK: PK_PAGE(), SK: pagePublished.id },
                            limit: 1
                        });

                        if (page) {
                            return page;
                        }
                        throw notFoundError;
                    }

                    // 2. If we received `args.url`, then...
                    const [[pagePublishedUrl]] = await db.read<PagePublishedUrl>({
                        ...defaults.db,
                        query: { PK: PK_PAGE_PUBLISHED_URL(), SK: args.url },
                        limit: 1
                    });

                    if (!pagePublishedUrl) {
                        throw notFoundError;
                    }

                    const [[page]] = await db.read<Page>({
                        ...defaults.db,
                        query: { PK: PK_PAGE(), SK: pagePublishedUrl.id },
                        limit: 1
                    });

                    if (page) {
                        return page;
                    }
                    throw notFoundError;
                },

                async create(categorySlug) {
                    await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

                    const category = await context.pageBuilder.categories.get(categorySlug);
                    if (!category) {
                        throw new NotFoundError(`Category with slug "${categorySlug}" not found.`);
                    }

                    const title = "Untitled";
                    const url = category.url + "untitled-" + uniqid.time();

                    const identity = context.security.getIdentity();
                    new CreateDataModel().populate({ category: category.slug }).validate();

                    const [uniqueId, version] = [mdbid(), 1];
                    const id = `${uniqueId}#${getZeroPaddedVersionNumber(version)}`;

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

                    const data = {
                        PK: PK_PAGE(),
                        SK: id,
                        TYPE: TYPE_PAGE,
                        id,
                        locale: context.i18nContent.getLocale().code,
                        tenant: context.security.getTenant().id,
                        editor: DEFAULT_EDITOR,
                        category: category.slug,
                        title,
                        url,
                        version: 1,
                        status: STATUS_DRAFT,
                        locked: false,
                        publishedOn: null,
                        home: false,
                        error: false,
                        notFound: false,
                        createdFrom: null,
                        settings: await updateSettingsModel.toJSON(),
                        savedOn: new Date().toISOString(),
                        createdOn: new Date().toISOString(),
                        ownedBy: owner,
                        createdBy: owner
                    };

                    await executeHookCallbacks(hookPlugins, "beforeCreate", context, data);

                    await db
                        .batch()
                        .create({ ...defaults.db, data })
                        .create({
                            ...defaults.db,
                            data: { PK: PK_PAGE_LATEST(), SK: uniqueId, TYPE: TYPE_PAGE_LATEST, id }
                        })
                        .execute();

                    // Index page in "Elastic Search"
                    await elasticSearch.index({
                        ...ES_DEFAULTS(),
                        id: "L#" + uniqueId,
                        body: getESLatestPageData(context, data)
                    });

                    await executeHookCallbacks(hookPlugins, "afterCreate", context, data);

                    return omit<Page>(["PK", "SK"], data);
                },

                async createFrom(from) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "w"
                    });

                    const [fromUniqueId] = from.split("#");

                    const [[[page]], [[latestPageData]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE(),
                                SK: from
                            }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE_LATEST(),
                                SK: fromUniqueId
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

                    const [, latestPageVersion] = latestPageData.id.split("#");
                    const nextVersion = parseInt(latestPageVersion) + 1;
                    const nextId = `${fromUniqueId}#${getZeroPaddedVersionNumber(nextVersion)}`;
                    const identity = context.security.getIdentity();

                    const data = {
                        ...page,
                        SK: nextId,
                        id: nextId,
                        status: STATUS_DRAFT,
                        locked: false,
                        publishedOn: null,
                        home: false,
                        error: false,
                        notFound: false,
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

                    await executeHookCallbacks(hookPlugins, "beforeCreate", context, data);

                    await db
                        .batch()
                        .create({ ...defaults.db, data })
                        .update({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE_LATEST(),
                                SK: fromUniqueId
                            },
                            data: {
                                PK: PK_PAGE_LATEST(),
                                SK: fromUniqueId,
                                TYPE: TYPE_PAGE_LATEST,
                                id: nextId
                            }
                        })
                        .execute();

                    // Replace existing `"L#" + fromParent` entry with the new one.
                    await elasticSearch.index({
                        ...ES_DEFAULTS(),
                        id: "L#" + fromUniqueId,
                        body: getESLatestPageData(context, data)
                    });

                    await executeHookCallbacks(hookPlugins, "afterCreate", context, data);

                    return data;
                },

                async update(id, data) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "w"
                    });

                    const [uniqueId] = id.split("#");

                    const [[[page]], [[latestPageData]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE(), SK: id },
                            limit: 1
                        })
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE_LATEST(), SK: uniqueId },
                            limit: 1
                        })
                        .execute();

                    if (!page) {
                        throw new NotFoundError(`Page "${id}" not found.`);
                    }

                    if (page.locked) {
                        throw new Error(`Cannot update page because it's locked.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    const updateDataModel = new UpdateDataModel().populate(data);
                    await updateDataModel.validate();

                    const updateData = await updateDataModel.toJSON({ onlyDirty: true });

                    const updateSettingsModel = new UpdateSettingsModel()
                        .populate(page.settings)
                        .populate(data.settings);

                    await updateSettingsModel.validate();

                    updateData.settings = await updateSettingsModel.toJSON();
                    updateData.savedOn = new Date().toISOString();

                    await executeHookCallbacks(hookPlugins, "beforeUpdate", context, page);

                    await db.update({
                        ...defaults.db,
                        query: { PK: PK_PAGE(), SK: id },
                        data: updateData
                    });

                    // If we updated the latest version, then make sure the changes are propagated to ES too.
                    if (latestPageData.id === id) {
                        // Index file in "Elastic Search"
                        await elasticSearch.update({
                            ...ES_DEFAULTS(),
                            id: `L#${uniqueId}`,
                            body: {
                                doc: getESUpdateLatestPageData(updateData)
                            }
                        });
                    }

                    await executeHookCallbacks(hookPlugins, "afterUpdate", context, page);

                    return { ...page, ...data };
                },

                async delete(pageId) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "d"
                    });

                    const [pageUniqueId, pageVersion] = pageId.split("#");

                    // 1. Load the page and latest / published page (revision) data.
                    const [[[page]], [[latestPageData]], [[publishedPageData]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE(), SK: pageId },
                            limit: 1
                        })
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE_LATEST(), SK: pageUniqueId },
                            limit: 1
                        })
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE_PUBLISHED(), SK: pageUniqueId },
                            limit: 1
                        })
                        .execute();

                    // 2. Do a couple of checks.
                    if (!page) {
                        throw new NotFoundError(`Page "${pageId}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    // 3. Let's start updating. But first, let's trigger before-delete hook callbacks.
                    await executeHookCallbacks(hookPlugins, "beforeDelete", context, page);

                    // If we are deleting the initial version, we need to remove all versions and all of the extra data.
                    if (pageVersion === getZeroPaddedVersionNumber(1)) {
                        // 4.1. We delete pages in batches of 10.
                        while (true) {
                            const [pagesBatch] = await db.read({
                                ...defaults.db,
                                query: { PK: PK_PAGE(), SK: { $beginsWith: pageUniqueId } }
                            });

                            if (pagesBatch.length === 0) {
                                break;
                            }

                            const batch = db.batch();
                            for (let i = 0; i < pagesBatch.length; i++) {
                                const page = pagesBatch[i];
                                batch.delete({
                                    ...defaults.db,
                                    query: { PK: PK_PAGE(), SK: page.id }
                                });
                            }

                            await batch.execute();
                        }

                        // 4.2. Delete latest / published data.
                        await db
                            .batch()
                            .delete({
                                ...defaults.db,
                                query: {
                                    PK: PK_PAGE_LATEST(),
                                    SK: pageUniqueId
                                }
                            })
                            .delete({
                                ...defaults.db,
                                query: {
                                    PK: PK_PAGE_PUBLISHED(),
                                    SK: pageUniqueId
                                }
                            })
                            .execute();

                        // 4.3. Finally, delete data from ES.
                        await elasticSearch.bulk({
                            body: [
                                {
                                    delete: {
                                        _id: `L#${pageUniqueId}`,
                                        _index: ES_DEFAULTS().index
                                    }
                                },
                                {
                                    delete: {
                                        _id: `P#${pageUniqueId}`,
                                        _index: ES_DEFAULTS().index
                                    }
                                }
                            ]
                        });

                        return [page, null];
                    }

                    // 5. If we are deleting a specific version (version > 1)...

                    // 6.1. Delete the actual page entry.
                    const batch = db.batch().delete({
                        ...defaults.db,
                        query: { PK: PK_PAGE(), SK: pageId }
                    });

                    // We need to update / delete data in ES too.
                    const esOperations = [];

                    const isLatest = latestPageData?.id === pageId;
                    const isPublished = publishedPageData?.id === pageId;
                    let latestPage = null;

                    // 6.2. If the page is published, remove published data, both from DB and ES.
                    if (isPublished) {
                        batch.delete({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE_PUBLISHED(),
                                SK: pageUniqueId
                            }
                        });

                        esOperations.push({
                            delete: { _id: `P#${pageUniqueId}`, _index: ES_DEFAULTS().index }
                        });
                    }

                    // 6.3. If the page is latest, assign the previously latest page as the new latest.
                    // Updates must be made again both on DB and ES side.
                    if (isLatest) {
                        [[latestPage]] = await db.read({
                            ...defaults.db,
                            query: { PK: PK_PAGE(), SK: { $lt: pageId } },
                            sort: { SK: -1 },
                            limit: 1
                        });

                        // Update latest page data.
                        batch.update({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE_LATEST(),
                                SK: pageUniqueId
                            },
                            data: {
                                PK: PK_PAGE_LATEST(),
                                SK: pageUniqueId,
                                TYPE: TYPE_PAGE_LATEST,
                                id: latestPage.id
                            }
                        });

                        // And of course, update the published revision entry in ES.
                        esOperations.push(
                            { index: { _id: `L#${pageUniqueId}`, _index: ES_DEFAULTS().index } },
                            getESLatestPageData(context, latestPage)
                        );
                    }

                    await batch.execute();

                    // When deleting a non-published and non-latest revision, we mustn't execute the bulk operation.
                    if (esOperations.length) {
                        await elasticSearch.bulk({ body: esOperations });
                    }

                    await executeHookCallbacks(hookPlugins, "afterDelete", context, page);

                    // 7. Done. We return both the deleted page, and the new latest one (if there is one).
                    return [page, latestPage];
                },

                async publish(pageId: string) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rcpu: "p"
                    });

                    const [pageUniqueId] = pageId.split("#");

                    const [[[page]], [[publishedPageData]], [[latestPageData]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE(), SK: pageId },
                            limit: 1
                        })
                        .read({
                            ...defaults.db,
                            limit: 1,
                            query: {
                                PK: PK_PAGE_PUBLISHED(),
                                SK: pageUniqueId
                            }
                        })
                        .read({
                            ...defaults.db,
                            limit: 1,
                            query: {
                                PK: PK_PAGE_LATEST(),
                                SK: pageUniqueId
                            }
                        })
                        .execute();

                    if (!page) {
                        throw new NotFoundError(`Page "${pageId}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    await executeHookCallbacks(hookPlugins, "beforePublish", context, page);

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
                            PK: PK_PAGE(),
                            SK: pageId
                        },
                        data: page
                    });

                    if (publishedPageData) {
                        // If there is a `published` page already, we need to set it as `unpublished`. We need to
                        // execute two updates - update the previously published page's status and the published
                        // page entry (PK_PAGE_PUBLISHED()).

                        // 🤦 DynamoDB does not support `batchUpdate` - so here we load the previously published
                        // page's data so that we can update its status within a batch operation. If, hopefully,
                        // they introduce a true update batch operation, remove this `read` call.

                        const [[previouslyPublishedPage]] = await db.read<Page>({
                            ...defaults.db,
                            query: { PK: PK_PAGE(), SK: publishedPageData.id },
                            limit: 1
                        });

                        previouslyPublishedPage.status = STATUS_UNPUBLISHED;

                        await db.update({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE(),
                                SK: publishedPageData.id
                            },
                            data: omit(["PK", "SK"], previouslyPublishedPage)
                        });

                        batch
                            .update({
                                ...defaults.db,
                                query: {
                                    PK: PK_PAGE_PUBLISHED(),
                                    SK: pageUniqueId
                                },
                                data: {
                                    PK: PK_PAGE_PUBLISHED(),
                                    SK: pageUniqueId,
                                    TYPE: TYPE_PAGE_PUBLISHED,
                                    id: pageId
                                }
                            })
                            .update({
                                ...defaults.db,
                                query: {
                                    PK: PK_PAGE_PUBLISHED_URL(),
                                    SK: pageUniqueId
                                },
                                data: {
                                    PK: PK_PAGE_PUBLISHED_URL(),
                                    SK: page.url,
                                    TYPE: TYPE_PAGE_PUBLISHED_URL,
                                    id: page.id,
                                    url: page.url
                                }
                            });
                    } else {
                        batch
                            .create({
                                ...defaults.db,
                                data: {
                                    PK: PK_PAGE_PUBLISHED(),
                                    SK: pageUniqueId,
                                    TYPE: TYPE_PAGE_PUBLISHED,
                                    id: pageId
                                }
                            })
                            .create({
                                ...defaults.db,
                                data: {
                                    PK: PK_PAGE_PUBLISHED_URL(),
                                    SK: page.url,
                                    TYPE: TYPE_PAGE_PUBLISHED_URL,
                                    id: page.id,
                                    url: page.url
                                }
                            });
                    }

                    await batch.execute();

                    // Update data in ES.
                    const esOperations = [];

                    // If we are publishing the latest revision, let's also update the latest revision entry's status in ES.
                    if (latestPageData?.id === pageId) {
                        esOperations.push(
                            { update: { _id: `L#${pageUniqueId}`, _index: ES_DEFAULTS().index } },
                            {
                                doc: {
                                    status: STATUS_PUBLISHED,
                                    locked: true,
                                    publishedOn: page.publishedOn
                                }
                            }
                        );
                    }

                    // And of course, update the published revision entry in ES.
                    esOperations.push(
                        { index: { _id: `P#${pageUniqueId}`, _index: ES_DEFAULTS().index } },
                        getESPublishedPageData(context, {
                            ...page,
                            id: pageId,
                            status: STATUS_PUBLISHED,
                            locked: true
                        })
                    );

                    await elasticSearch.bulk({ body: esOperations });

                    await executeHookCallbacks(hookPlugins, "afterPublish", context, page);

                    return page;
                },

                async unpublish(pageId: string) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rcpu: "u"
                    });

                    const [pageUniqueId] = pageId.split("#");

                    const [[[page]], [[publishedPageData]], [[latestPageData]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE(), SK: pageId },
                            limit: 1
                        })
                        .read({
                            ...defaults.db,
                            limit: 1,
                            query: {
                                PK: PK_PAGE_PUBLISHED(),
                                SK: pageUniqueId
                            }
                        })
                        .read({
                            ...defaults.db,
                            limit: 1,
                            query: {
                                PK: PK_PAGE_LATEST(),
                                SK: pageUniqueId
                            }
                        })
                        .execute();

                    if (!page) {
                        throw new NotFoundError(`Page "${pageId}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    if (!publishedPageData || publishedPageData.id !== pageId) {
                        throw new Error(`Page "${pageId}" is not published.`);
                    }

                    await executeHookCallbacks(hookPlugins, "beforeUnpublish", context, page);

                    page.status = STATUS_UNPUBLISHED;

                    await db
                        .batch()
                        .delete({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE_PUBLISHED(),
                                SK: pageUniqueId
                            }
                        })
                        .update({
                            ...defaults.db,
                            query: {
                                PK: PK_PAGE_PUBLISHED(),
                                SK: pageUniqueId
                            },
                            data: page
                        })
                        .execute();

                    // Update data in ES.
                    const esOperations = [];

                    // If we are unpublishing the latest revision, let's also update the latest revision entry's status in ES.
                    if (latestPageData.id === pageId) {
                        esOperations.push(
                            { update: { _id: `L#${pageUniqueId}`, _index: ES_DEFAULTS().index } },
                            { doc: { status: STATUS_UNPUBLISHED } }
                        );
                    }

                    // And of course, delete the published revision entry in ES.
                    esOperations.push({
                        delete: { _id: `P#${pageUniqueId}`, _index: ES_DEFAULTS().index }
                    });

                    await elasticSearch.bulk({ body: esOperations });

                    await executeHookCallbacks(hookPlugins, "afterUnpublish", context, page);

                    return page;
                },

                async requestReview(pageId: string) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rcpu: "r"
                    });

                    const [pageUniqueId] = pageId.split("#");

                    const [[[page]], [[latestPageData]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE(), SK: pageId },
                            limit: 1
                        })
                        .read({
                            ...defaults.db,
                            limit: 1,
                            query: {
                                PK: PK_PAGE_LATEST(),
                                SK: pageUniqueId
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

                    await db.update({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE(),
                            SK: pageId
                        },
                        data: omit(["PK", "SK"], page)
                    });

                    // If we updated the latest version, then make sure the changes are propagated to ES too.
                    if (latestPageData.id === pageId) {
                        // todo: should eliminate probably and store this flag into PAGE
                        const [uniqueId] = pageId.split("#");
                        // Index file in "Elastic Search"
                        await elasticSearch.update({
                            ...ES_DEFAULTS(),
                            id: `L#${uniqueId}`,
                            body: {
                                doc: {
                                    status: STATUS_REVIEW_REQUESTED,
                                    locked: true
                                }
                            }
                        });
                    }

                    return page;
                },

                async requestChanges(pageId: string) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rcpu: "c"
                    });

                    const [pageUniqueId] = pageId.split("#");

                    const [[[page]], [[latestPageData]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE(), SK: pageId },
                            limit: 1
                        })
                        .read({
                            ...defaults.db,
                            limit: 1,
                            query: {
                                PK: PK_PAGE_LATEST(),
                                SK: pageUniqueId
                            }
                        })
                        .execute();

                    if (!page) {
                        throw new NotFoundError(`Page "${pageId}" not found.`);
                    }

                    if (page.status !== STATUS_REVIEW_REQUESTED) {
                        throw new Error(
                            `Cannot request changes on a page that's not in review.`,
                            "REQUESTED_CHANGES_ON_NOT_IN_REVIEW_PAGE"
                        );
                    }

                    const identity = context.security.getIdentity();
                    if (page.ownedBy.id === identity.id) {
                        throw new Error(
                            "Cannot request changes on own page.",
                            "REQUEST_CHANGES_ON_OWN_PAGE"
                        );
                    }

                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    // Change loaded page's status to published.
                    page.status = STATUS_CHANGES_REQUESTED;
                    page.locked = false;

                    await db.update({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE(),
                            SK: pageId
                        },
                        data: omit(["PK", "SK"], page)
                    });

                    // If we updated the latest version, then make sure the changes are propagated to ES too.
                    if (latestPageData.id === pageId) {
                        // todo: should eliminate probably and store this flag into PAGE
                        const [uniqueId] = pageId.split("#");
                        // Index file in "Elastic Search"
                        await elasticSearch.update({
                            ...ES_DEFAULTS(),
                            id: `L#${uniqueId}`,
                            body: {
                                doc: {
                                    status: STATUS_CHANGES_REQUESTED,
                                    locked: false
                                }
                            }
                        });
                    }

                    return page;
                },

                async setAsHomepage(pageId) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rcpu: "c"
                    });

                    const [pageUniqueId] = pageId.split("#");

                    const [[[page]], [[latestPageData]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: { PK: PK_PAGE(), SK: pageId },
                            limit: 1
                        })
                        .read({
                            ...defaults.db,
                            limit: 1,
                            query: {
                                PK: PK_PAGE_LATEST(),
                                SK: pageUniqueId
                            }
                        })
                        .execute();

                    if (!page) {
                        throw new NotFoundError(`Page "${pageId}" not found.`);
                    }

                    if (page.status !== STATUS_REVIEW_REQUESTED) {
                        throw new Error(
                            `Cannot request changes on a page that's not in review.`,
                            "REQUESTED_CHANGES_ON_NOT_IN_REVIEW_PAGE"
                        );
                    }

                    const identity = context.security.getIdentity();
                    if (page.ownedBy.id === identity.id) {
                        throw new Error(
                            "Cannot request changes on own page.",
                            "REQUEST_CHANGES_ON_OWN_PAGE"
                        );
                    }

                    checkOwnPermissions(identity, permission, page, "ownedBy");

                    // Change loaded page's status to published.
                    page.status = STATUS_CHANGES_REQUESTED;
                    page.locked = false;

                    await db.update({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE(),
                            SK: pageId
                        },
                        data: omit(["PK", "SK"], page)
                    });

                    // If we updated the latest version, then make sure the changes are propagated to ES too.
                    if (latestPageData.id === pageId) {
                        // todo: should eliminate probably and store this flag into PAGE
                        const [uniqueId] = pageId.split("#");
                        // Index file in "Elastic Search"
                        await elasticSearch.update({
                            ...ES_DEFAULTS(),
                            id: `L#${uniqueId}`,
                            body: {
                                doc: {
                                    status: STATUS_CHANGES_REQUESTED,
                                    locked: false
                                }
                            }
                        });
                    }

                    return page;
                },

                async render(args) {
                    const { async, ...rest } = args;
                    return await context.handlerClient.invoke({
                        name: renderingFunction,
                        await: async,
                        payload: {
                            ...rest,
                            tenant: context.security.getTenant().id,
                            locale: i18nContent.getLocale().code
                        }
                    });
                }
            }
        };
    }
});

export default createPlugin;
