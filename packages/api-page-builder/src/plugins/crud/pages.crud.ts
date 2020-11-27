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
import getNormalizedListPagesArgs from "./pages/getNormalizedListPagesArgs";
import omit from "@ramda/omit";

export type Page = {
    id: string;
    title: string;
    snippet: string;
    url: string;
    category: string;
    published: boolean;
    publishedOn: string;
    version: number;
    latestVersion: boolean;
    settings: Record<string, any>;
    locked: boolean;
    createdOn: string;
    savedOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
};

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

const TYPE_PAGE = "pb#page";
const TYPE_PAGE_LATEST = TYPE_PAGE + "#lid";
const TYPE_PAGE_PUBLISHED = TYPE_PAGE + "#pid";

const hasRwd = ({ pbPagePermission, rwd }) => {
    if (typeof pbPagePermission.rwd !== "string") {
        return true;
    }

    return pbPagePermission.rwd.includes(rwd);
};

type SortOrder = "asc" | "desc";

export type PagesListArgs = {
    limit?: number;
    page?: number;
    where?: { category?: string; status?: string };
    sort?: { createdOn?: SortOrder; title?: SortOrder };
};

export default {
    type: "context",
    apply(context) {
        const { db, i18nContent, elasticSearch } = context;
        const PK_PAGE = `${i18nContent?.locale?.code}#P`;
        const PK_PAGE_LATEST = `${PK_PAGE}#L`;
        const PK_PAGE_PUBLISHED = `${PK_PAGE}#P`;

        context.pages = {
            async get(id: string) {
                const [[page]] = await db.read<Page>({
                    ...defaults.db,
                    query: { PK: PK_PAGE, SK: id },
                    limit: 1
                });

                return page;
            },

            async listLatest(args: PagesListArgs) {
                const { sort, from, size, filter } = getNormalizedListPagesArgs(args);

                const response = await elasticSearch.search({
                    ...defaults.es,
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "locale.keyword": i18nContent.locale.code } },
                                    { term: { __latest: true } },
                                    ...filter
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
                    ...defaults.es,
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
                    query: { PK: PK_PAGE, SK: { $beginsWith: pageIdWithoutVersion } }
                });

                return pages;
            },

            async create({ category: categorySlug }) {
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
                    PK: PK_PAGE,
                    SK: id,
                    TYPE_PAGE,
                    id,
                    category: category.slug,
                    title,
                    url,
                    version,
                    status: "draft",
                    locked: false,
                    publishedOn: null,
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
                        data: { PK: PK_PAGE_LATEST, SK: uniqueId, TYPE_PAGE_LATEST, id }
                    })
                    .execute();

                // Index file in "Elastic Search"
                await elasticSearch.index({
                    ...defaults.es,
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
                        tags: []
                    }
                });

                return data;
            },

            async createFrom({ from }) {
                const [fromUniqueId] = from.split("#");

                const [[[page]], [[latestPageData]]] = await db
                    .batch()
                    .read({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE,
                            SK: from
                        }
                    })
                    .read({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE_LATEST,
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
                    status: "draft",
                    locked: false,
                    publishedOn: null,
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
                            PK: PK_PAGE_LATEST,
                            SK: fromUniqueId
                        },
                        data: {
                            PK: PK_PAGE_LATEST,
                            SK: fromUniqueId,
                            TYPE_PAGE_LATEST,
                            id: nextId
                        }
                    })
                    .execute();

                // Replace existing `"L#" + fromParent` entry with the new one.
                await elasticSearch.index({
                    ...defaults.es,
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
                        publishedOn: data.publishedOn
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
                        query: { PK: PK_PAGE, SK: id },
                        limit: 1
                    })
                    .read({
                        ...defaults.db,
                        query: { PK: PK_PAGE_LATEST, SK: uniqueId },
                        limit: 1
                    })
                    .execute();

                if (!page) {
                    throw new NotFoundError(`Page "${id}" not found.`);
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
                    query: { PK: PK_PAGE, SK: id },
                    data
                });

                // If we updated the latest version, then make sure the changes are propagated to ES too.
                if (latestPageData.id === id) {
                    // Index file in "Elastic Search"
                    await elasticSearch.update({
                        ...defaults.es,
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

            async publish(pageId: string) {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                    throw new NotAuthorizedError();
                }

                pageId = decodeURIComponent(pageId);

                const [pageUniqueId] = pageId.split("#");

                const [[[page]], [[publishedPageData]], [[latestPageData]]] = await db
                    .batch()
                    .read({
                        ...defaults.db,
                        query: { PK: PK_PAGE, SK: pageId },
                        limit: 1
                    })
                    .read({
                        ...defaults.db,
                        limit: 1,
                        query: {
                            PK: PK_PAGE_PUBLISHED,
                            SK: pageUniqueId
                        }
                    })
                    .read({
                        ...defaults.db,
                        limit: 1,
                        query: {
                            PK: PK_PAGE_LATEST,
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
                page.status = "published";
                page.locked = true;
                page.publishedOn = new Date().toISOString();

                // We need to issue a couple of updates.
                const batch = db.batch();

                // 1. Update the page in the database first.
                batch.update({
                    ...defaults.db,
                    query: {
                        PK: PK_PAGE,
                        SK: pageId
                    },
                    data: page
                });

                if (publishedPageData) {
                    // If there is a `published` page already, we need to set it as `unpublished`. We need to
                    // execute two updates - update the previously published page's status and the published
                    // page entry (PK_PAGE_PUBLISHED).

                    // 🤦 DynamoDB does not support `batchUpdate` - so here we load the previously published
                    // page's data so that we can update its status within a batch operation. If, hopefully,
                    // they introduce a true update batch operation, remove this `read` call.
                    const [previouslyPublishedPage] = await db.read({
                        ...defaults.db,
                        query: { PK: PK_PAGE, SK: publishedPageData.id },
                        limit: 1
                    });

                    previouslyPublishedPage.status = "unpublished";

                    await db.update({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE,
                            SK: publishedPageData.id
                        },
                        data: previouslyPublishedPage
                    });

                    batch.update({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE_PUBLISHED,
                            SK: pageUniqueId
                        },
                        data: {
                            PK: PK_PAGE_PUBLISHED,
                            SK: pageUniqueId,
                            TYPE: TYPE_PAGE_PUBLISHED,
                            id: pageId
                        }
                    });
                } else {
                    batch.create({
                        ...defaults.db,
                        data: {
                            PK: PK_PAGE_PUBLISHED,
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
                                status: "published",
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
                        status: "published",
                        locked: true,
                        publishedOn: page.publishedOn
                    }
                );

                await elasticSearch.bulk({ body: esOperations });

                return page;
            },

            async unpublish(pageId: string) {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                    throw new NotAuthorizedError();
                }

                pageId = decodeURIComponent(pageId);

                const [pageUniqueId] = pageId.split("#");

                const [[[page]], [[publishedPageData]], [[latestPageData]]] = await db
                    .batch()
                    .read({
                        ...defaults.db,
                        query: { PK: PK_PAGE, SK: pageId },
                        limit: 1
                    })
                    .read({
                        ...defaults.db,
                        limit: 1,
                        query: {
                            PK: PK_PAGE_PUBLISHED,
                            SK: pageUniqueId
                        }
                    })
                    .read({
                        ...defaults.db,
                        limit: 1,
                        query: {
                            PK: PK_PAGE_LATEST,
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

                page.status = "unpublished";

                await db
                    .batch()
                    .delete({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE_PUBLISHED,
                            SK: pageUniqueId
                        }
                    })
                    .update({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE_PUBLISHED,
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
                        { doc: { status: "unpublished" } }
                    );
                }

                // And of course, delete the published revision entry in ES.
                esOperations.push({ delete: { _id: `P#${pageUniqueId}`, _index: "page-builder" } });

                await elasticSearch.bulk({ body: esOperations });

                return page;
            },

            async delete(id) {
                const [uniqueId] = id.split("#");
                await db.delete({
                    ...defaults.db,
                    query: { PK: PK_PAGE, SK: id }
                });

                // Delete pages from ES.
                await elasticSearch.delete({
                    ...defaults.es,
                    id: `L#${uniqueId}`
                });

                // TODO: finish this.
            },

            async requestReview(pageId: string) {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                    throw new NotAuthorizedError();
                }

                pageId = decodeURIComponent(pageId);

                const [pageUniqueId] = pageId.split("#");

                const [[[page]], [[latestPageData]]] = await db
                    .batch()
                    .read({
                        ...defaults.db,
                        query: { PK: PK_PAGE, SK: pageId },
                        limit: 1
                    })
                    .read({
                        ...defaults.db,
                        limit: 1,
                        query: {
                            PK: PK_PAGE_LATEST,
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

                // Change loaded page's status to `reviewRequested`.
                page.status = "reviewRequested";
                page.locked = true;

                const nocic = 'sad'
                try {
                    await db.update({
                        ...defaults.db,
                        query: {
                            PK: PK_PAGE,
                            SK: pageId
                        },
                        data: omit(page, ['PK', 'SK'])
                    });
                } catch (e) {
                    console.log(e)
                }

                // If we updated the latest version, then make sure the changes are propagated to ES too.
                if (latestPageData.id === pageId) {
                    // todo: should eliminate probably and store this flag into PAGE
                    const [uniqueId] = pageId.split("#");
                    // Index file in "Elastic Search"
                    await elasticSearch.update({
                        ...defaults.es,
                        id: `L#${uniqueId}`,
                        body: {
                            doc: {
                                status: "reviewRequested",
                                locked: true
                            }
                        }
                    });
                }

                return page;
            },

            async requestChanges(pageId: string) {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                    throw new NotAuthorizedError();
                }

                pageId = decodeURIComponent(pageId);

                const [pageUniqueId] = pageId.split("#");

                const [[[page]], [[latestPageData]]] = await db
                    .batch()
                    .read({
                        ...defaults.db,
                        query: { PK: PK_PAGE, SK: pageId },
                        limit: 1
                    })
                    .read({
                        ...defaults.db,
                        limit: 1,
                        query: {
                            PK: PK_PAGE_LATEST,
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
                page.status = "changesRequested";
                page.locked = false;

                await db.update({
                    ...defaults.db,
                    query: {
                        PK: PK_PAGE,
                        SK: pageId
                    },
                    data: omit(page, ['PK', 'SK'])
                });

                // If we updated the latest version, then make sure the changes are propagated to ES too.
                if (latestPageData.id === pageId) {
                    // todo: should eliminate probably and store this flag into PAGE
                    const [uniqueId] = pageId.split("#");
                    // Index file in "Elastic Search"
                    await elasticSearch.update({
                        ...defaults.es,
                        id: `L#${uniqueId}`,
                        body: {
                            doc: {
                                status: "changesRequested",
                                locked: false
                            }
                        }
                    });
                }

                return page;
            }
        };
    }
} as ContextPlugin<DbContext, I18NContentContext>;
