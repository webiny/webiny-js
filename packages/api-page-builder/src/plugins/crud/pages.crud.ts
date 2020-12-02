import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import mdbid from "mdbid";
import { withFields, string } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import defaults from "./defaults";
import uniqid from "uniqid";
import { NotAuthorizedError } from "@webiny/api-security";
import Error from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import getNormalizedListPagesArgs from "./utils/getNormalizedListPagesArgs";
import omit from "@ramda/omit";
import { SecurityContext } from "@webiny/api-security/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import { Context as HandlerContext } from "@webiny/handler/types";
import getPKPrefix from "./utils/getPKPrefix";
import {TenancyContext} from "@webiny/api-security-tenancy/types";

export type Page = {
    id: string;
    title: string;
    snippet: string;
    url: string;
    category: string;
    publishedOn: string;
    version: number;
    settings: Record<string, any>;
    locked: boolean;
    status: string;
    home: boolean;
    error: boolean;
    notFound: boolean;
    createdOn: string;
    savedOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
};

const STATUS_CHANGES_REQUESTED = "changesRequested";
const STATUS_REVIEW_REQUESTED = "reviewRequested";
const STATUS_DRAFT = "draft";
const STATUS_PUBLISHED = "published";
const STATUS_UNPUBLISHED = "unpublished";

const CreateDataModel = withFields({
    category: string({ validation: validation.create("required,maxLength:100") })
})();

const UpdateDataModel = withFields({
    title: string({
        value: "Untitled",
        validation: validation.create("maxLength:150")
    }),
    snippet: string({ validation: validation.create("maxLength:500") }),
    url: string({ validation: validation.create("maxLength:100") }),
    category: string({ validation: validation.create("maxLength:100") }),
    content: object(),
    settings: object(),
    tags: string({
        list: true,
        validation: value => {
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    validation.validateSync(value[i], "maxLength:50");
                }
            }
        }
    })
})();

const TYPE_PAGE = "pb.page";
const TYPE_PAGE_LATEST = TYPE_PAGE + ".l";
const TYPE_PAGE_PUBLISHED = TYPE_PAGE + ".p";

const hasRwd = ({ pbPagePermission, rwd }) => {
    if (typeof pbPagePermission.rwd !== "string") {
        return true;
    }

    return pbPagePermission.rwd.includes(rwd);
};

const hasRcpu = ({ pbPagePermission, rcpu }) => {
    if (typeof pbPagePermission.rcpu !== "string") {
        return true;
    }

    return pbPagePermission.rcpu.includes(rcpu);
};

type SortOrder = "asc" | "desc";

export type PagesListArgs = {
    limit?: number;
    page?: number;
    where?: { category?: string; status?: string };
    sort?: { createdOn?: SortOrder; title?: SortOrder };
};

type Context = HandlerContext<
    DbContext,
    SecurityContext,
    I18NContentContext,
    ElasticSearchClientContext,
    TenancyContext
>;

const plugin: ContextPlugin<Context> = {
    type: "context",
    apply(context) {
        const { db, i18nContent, elasticSearch } = context;

        const PK_PAGE = () => `${getPKPrefix(context)}P`;
        const PK_PAGE_LATEST = () => PK_PAGE() + "#L";
        const PK_PAGE_PUBLISHED = () => PK_PAGE() + "#P";

        const ES_DEFAULTS = () => defaults.es(context);

        context.pages = {
            async get(id: string) {
                const [[page]] = await db.read<Page>({
                    ...defaults.db,
                    query: { PK: PK_PAGE(), SK: id },
                    limit: 1
                });

                return page;
            },

            async listLatest(args: PagesListArgs) {
                await context.i18nContent.checkI18NContentPermission();
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (!pbPagePermission || !hasRwd({ pbPagePermission, rwd: "r" })) {
                    throw new NotAuthorizedError();
                }

                const { sort, from, size, filter } = getNormalizedListPagesArgs(args);

                // If users can only manage own records, let's add the special filter.
                const ownFilter = [];
                if (pbPagePermission?.own === true) {
                    const identity = context.security.getIdentity();
                    ownFilter.push({ term: { "createdBy.id.keyword": identity.id } });
                }

                const response = await elasticSearch.search({
                    ...ES_DEFAULTS(),
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "locale.keyword": i18nContent.locale.code } },
                                    { term: { __latest: true } },
                                    ...filter,
                                    ...ownFilter
                                ]
                            }
                        },
                        from,
                        size,
                        sort
                    }
                });

                return response?.body?.hits?.hits?.map(item => item._source);
            },

            async listPublished(args: PagesListArgs) {
                const { limit = 10 } = args;

                const response = await elasticSearch.search({
                    ...ES_DEFAULTS(),
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "locale.keyword": i18nContent.locale.code } },
                                    { term: { __published: true } }
                                ]
                            }
                        },
                        size: limit,
                        sort: { createdOn: "desc" }
                    }
                });

                return response?.body?.hits?.hits?.map(item => item._source);
            },

            async listRevisionsForPage(pageId: string) {
                const [pageIdWithoutVersion] = pageId.split("#");
                const [pages] = await db.read<Page>({
                    ...defaults.db,
                    query: { PK: PK_PAGE(), SK: { $beginsWith: pageIdWithoutVersion } }
                });

                return pages;
            },

            async create({ category: categorySlug }) {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                    return new NotAuthorizedError();
                }

                const category = await context.categories.get(categorySlug);
                if (!category) {
                    throw new NotFoundError(`Category with slug "${categorySlug}" not found.`);
                }

                const title = "Untitled";
                const url = category.url + "untitled-" + uniqid.time();

                const identity = context.security.getIdentity();
                new CreateDataModel().populate({ category: category.slug }).validate();

                const [uniqueId, version] = [mdbid(), 1];
                const id = `${uniqueId}#${version}`;

                const data = {
                    PK: PK_PAGE(),
                    SK: id,
                    TYPE_PAGE,
                    id,
                    category: category.slug,
                    title,
                    url,
                    version,
                    status: STATUS_DRAFT,
                    locked: false,
                    publishedOn: null,
                    home: false,
                    error: false,
                    notFound: false,
                    savedOn: new Date().toISOString(),
                    createdFrom: null,
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName
                    }
                };

                await db
                    .batch()
                    .create({ ...defaults.db, data })
                    .create({
                        ...defaults.db,
                        data: { PK: PK_PAGE_LATEST(), SK: uniqueId, TYPE_PAGE_LATEST, id }
                    })
                    .execute();

                // Index file in "Elastic Search"
                await elasticSearch.index({
                    ...ES_DEFAULTS(),
                    id: "L#" + uniqueId,
                    body: {
                        __latest: true,
                        id,
                        locale: i18nContent?.locale?.code,
                        // TODO: tenant
                        createdOn: data.createdOn,
                        savedOn: data.savedOn,
                        createdBy: data.createdBy,
                        category: data.category,
                        version: data.version,
                        title: data.title,
                        url: data.url,
                        status: data.status,
                        locked: data.locked,
                        publishedOn: data.publishedOn,
                        home: false,
                        error: false,
                        notFound: false,
                        tags: []
                    }
                });

                return data;
            },

            async createFrom({ from }) {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                    return new NotAuthorizedError();
                }

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

                const [, latestPageVersion] = latestPageData.id.split("#");
                const nextVersion = parseInt(latestPageVersion) + 1;
                const nextId = `${fromUniqueId}#${nextVersion}`;
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
                        displayName: identity.displayName
                    }
                };

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
                            TYPE_PAGE_LATEST,
                            id: nextId
                        }
                    })
                    .execute();

                // Replace existing `"L#" + fromParent` entry with the new one.
                await elasticSearch.index({
                    ...ES_DEFAULTS(),
                    id: "L#" + fromUniqueId,
                    body: {
                        __latest: true,
                        id: nextId,
                        locale: i18nContent?.locale?.code,
                        // TODO: tenant
                        createdOn: data.createdOn,
                        savedOn: data.savedOn,
                        createdBy: data.createdBy,
                        category: data.category,
                        version: data.version,
                        title: data.title,
                        url: data.url,
                        tags: data.tags,
                        status: data.status,
                        locked: data.locked,
                        publishedOn: data.publishedOn,
                        home: false,
                        error: false,
                        notFound: false
                    }
                });

                return data;
            },

            async update(id, data) {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                    throw new NotAuthorizedError();
                }

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

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbPagePermission?.own === true) {
                    const identity = context.security.getIdentity();
                    if (page.createdBy.id !== identity.id) {
                        throw new NotAuthorizedError();
                    }
                }

                const updateData = new UpdateDataModel().populate(data);
                await updateData.validate();

                data = Object.assign(await updateData.toJSON({ onlyDirty: true }), {
                    savedOn: new Date().toISOString()
                });

                await db.update({
                    ...defaults.db,
                    query: { PK: PK_PAGE(), SK: id },
                    data
                });

                // If we updated the latest version, then make sure the changes are propagated to ES too.
                if (latestPageData.id === id) {
                    // Index file in "Elastic Search"
                    await elasticSearch.update({
                        ...ES_DEFAULTS(),
                        id: `L#${uniqueId}`,
                        body: {
                            doc: {
                                tags: data.tags,
                                title: data.title,
                                url: data.url,
                                savedOn: data.savedOn
                            }
                        }
                    });
                }

                return { ...page, ...data };
            },

            async delete(id) {
                const [uniqueId] = id.split("#");
                await db.delete({
                    ...defaults.db,
                    query: { PK: PK_PAGE(), SK: id }
                });

                // Delete pages from ES.
                await elasticSearch.delete({
                    ...ES_DEFAULTS(),
                    id: `L#${uniqueId}`
                });

                // TODO: finish this.
            },

            async publish(pageId: string) {
                await context.i18nContent.checkI18NContentPermission();
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (!pbPagePermission || !hasRcpu({ pbPagePermission, rcpu: "p" })) {
                    throw new NotAuthorizedError();
                }

                pageId = decodeURIComponent(pageId);

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

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbPagePermission?.own === true) {
                    const identity = context.security.getIdentity();
                    if (page.createdBy.id !== identity.id) {
                        throw new NotAuthorizedError();
                    }
                }

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
                    // TODO: test this! publishing a new revision with a revision that has already been published.
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

                    batch.update({
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
                    });
                } else {
                    batch.create({
                        ...defaults.db,
                        data: {
                            PK: PK_PAGE_PUBLISHED(),
                            SK: pageUniqueId,
                            TYPE: TYPE_PAGE_PUBLISHED,
                            id: pageId
                        }
                    });
                }

                await batch.execute();

                // Update data in ES.
                const esOperations = [];

                // If we are publishing the latest revision, let's also update the latest revision entry's status in ES.
                if (latestPageData.id === pageId) {
                    esOperations.push(
                        { update: { _id: `L#${pageUniqueId}`, _index: "page-builder" } },
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
                    { index: { _id: `P#${pageUniqueId}`, _index: "page-builder" } },
                    {
                        __published: true,
                        id: pageId,
                        locale: i18nContent?.locale?.code,
                        // TODO: tenant
                        createdOn: page.createdOn,
                        savedOn: page.savedOn,
                        createdBy: page.createdBy,
                        category: page.category,
                        version: page.version,
                        title: page.title,
                        url: page.url,
                        tags: page.tags,
                        status: STATUS_PUBLISHED,
                        locked: true,
                        publishedOn: page.publishedOn
                    }
                );

                await elasticSearch.bulk({ body: esOperations });

                return page;
            },

            async unpublish(pageId: string) {
                await context.i18nContent.checkI18NContentPermission();
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (!pbPagePermission || !hasRcpu({ pbPagePermission, rcpu: "u" })) {
                    throw new NotAuthorizedError();
                }

                pageId = decodeURIComponent(pageId);

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

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbPagePermission?.own === true) {
                    const identity = context.security.getIdentity();
                    if (page.createdBy.id !== identity.id) {
                        throw new NotAuthorizedError();
                    }
                }

                if (!publishedPageData || publishedPageData.id !== pageId) {
                    throw new Error(`Page "${pageId}" is not published.`);
                }

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

                // If we are publishing the latest revision, let's also update the latest revision entry's status in ES.
                if (latestPageData.id === pageId) {
                    esOperations.push(
                        { update: { _id: `L#${pageUniqueId}`, _index: "page-builder" } },
                        { doc: { status: STATUS_UNPUBLISHED } }
                    );
                }

                // And of course, delete the published revision entry in ES.
                esOperations.push({ delete: { _id: `P#${pageUniqueId}`, _index: "page-builder" } });

                await elasticSearch.bulk({ body: esOperations });

                return page;
            },

            async requestReview(pageId: string) {
                await context.i18nContent.checkI18NContentPermission();
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (!pbPagePermission || !hasRcpu({ pbPagePermission, rcpu: "r" })) {
                    throw new NotAuthorizedError();
                }

                pageId = decodeURIComponent(pageId);

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

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbPagePermission?.own === true) {
                    const identity = context.security.getIdentity();
                    if (page.createdBy.id !== identity.id) {
                        throw new NotAuthorizedError();
                    }
                }

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
                await context.i18nContent.checkI18NContentPermission();
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (!pbPagePermission || !hasRcpu({ pbPagePermission, rcpu: "c" })) {
                    throw new NotAuthorizedError();
                }

                pageId = decodeURIComponent(pageId);

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
                if (page.createdBy.id === identity.id) {
                    throw new Error(
                        "Cannot request changes on own page.",
                        "REQUEST_CHANGES_ON_OWN_PAGE"
                    );
                }

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbPagePermission?.own === true) {
                    if (page.createdBy.id !== identity.id) {
                        throw new NotAuthorizedError();
                    }
                }

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

            setAsHomepage() {
                // HOME-PAGE-STUFF
                // Has permission to change this?
                // Cannot set unpublished page as XYZ.
                // The page is already set as homepage.
            }
        };
    }
};

export default plugin;
