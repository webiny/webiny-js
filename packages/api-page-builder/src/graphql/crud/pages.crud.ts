import mdbid from "mdbid";
import uniqid from "uniqid";
import lodashGet from "lodash/get";
import DataLoader from "dataloader";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    OnBeforePageCreateTopicParams,
    Page,
    PageBuilderContextObject,
    PagesCrud,
    PageSecurityPermission,
    PageStorageOperations,
    PageStorageOperationsGetWhereParams,
    PageStorageOperationsListParams,
    PageStorageOperationsListTagsParams,
    PbContext
} from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import normalizePath from "./pages/normalizePath";
import { compressContent, extractContent } from "./pages/contentCompression";
import { CreateDataModel, UpdateSettingsModel } from "./pages/models";
import { PagePlugin } from "~/plugins/PagePlugin";
import WebinyError from "@webiny/error";
import lodashTrimEnd from "lodash/trimEnd";
import { getZeroPaddedVersionNumber } from "~/utils/zeroPaddedVersionNumber";
import {
    FlushParams,
    OnAfterPageCreateFromTopicParams,
    OnAfterPageCreateTopicParams,
    OnAfterPageDeleteTopicParams,
    OnAfterPagePublishTopicParams,
    OnAfterPageRequestChangesTopicParams,
    OnAfterPageRequestReviewTopicParams,
    OnAfterPageUnpublishTopicParams,
    OnAfterPageUpdateTopicParams,
    OnBeforePageCreateFromTopicParams,
    OnBeforePageDeleteTopicParams,
    OnBeforePagePublishTopicParams,
    OnBeforePageRequestChangesTopicParams,
    OnBeforePageRequestReviewTopicParams,
    OnBeforePageUnpublishTopicParams,
    OnBeforePageUpdateTopicParams,
    RenderParams
} from "~/graphql/types";
import { ContentCompressionPlugin } from "~/plugins/ContentCompressionPlugin";
import { createTopic } from "@webiny/pubsub";
import { parseIdentifier } from "../../../../utils/src";

const STATUS_CHANGES_REQUESTED = "changesRequested";
const STATUS_REVIEW_REQUESTED = "reviewRequested";
const STATUS_DRAFT = "draft";
const STATUS_PUBLISHED = "published";
const STATUS_UNPUBLISHED = "unpublished";

const DEFAULT_EDITOR = "page-builder";
const PERMISSION_NAME = "pb.page";

interface DataLoaderGetByIdKey {
    id: string;
    latest?: boolean;
    published?: boolean;
}

const createNotIn = (exclude?: string[]): { paths: string[]; ids: string[] } => {
    const paths: string[] = [];
    const ids: string[] = [];
    if (Array.isArray(exclude)) {
        for (const item of exclude) {
            /**
             * Page "path" will always starts with a slash.
             */
            if (item.includes("/")) {
                /**
                 * Let's also ensure the trailing slash is removed.
                 */
                paths.push(lodashTrimEnd(item, "/"));
                continue;
            }
            ids.push(item);
        }
    }
    return {
        paths: paths.length > 0 ? paths : undefined,
        ids: ids.length > 0 ? ids : undefined
    };
};

const extractPageContent = async (
    plugins: ContentCompressionPlugin[],
    page?: Page
): Promise<Page | null> => {
    if (!page || !page.content) {
        return page;
    }
    const content = await extractContent(plugins, page);
    return {
        ...page,
        content
    };
};

const createSort = (sort?: string[]): string[] => {
    if (Array.isArray(sort) === false || sort.length === 0) {
        return ["createdOn_DESC"];
    }
    return sort;
};

const createDataLoaderKeys = (id: string): DataLoaderGetByIdKey[] => {
    const { id: pid } = parseIdentifier(id);
    return [
        {
            id
        },
        {
            id,
            latest: true
        },
        {
            id,
            published: true
        },
        {
            id: pid
        },
        {
            id: pid,
            latest: true
        },
        {
            id: pid,
            published: true
        }
    ];
};

export interface Params {
    context: PbContext;
    storageOperations: PageStorageOperations;
}
export const createPageCrud = (params: Params): PagesCrud => {
    const { context, storageOperations } = params;

    /**
     * Used in a couple of key events - (un)publishing and pages deletion.
     */
    const pagePlugins = context.plugins.byType<PagePlugin>(PagePlugin.type);
    /**
     * Content compression plugins used when compressing and decompressing the content.
     * We reverse it because we want to apply the last one if possible.
     */
    const contentCompressionPlugins = context.plugins
        .byType<ContentCompressionPlugin>(ContentCompressionPlugin.type)
        .reverse();
    if (contentCompressionPlugins.length === 0) {
        throw new WebinyError(
            "Missing content compression plugins. Must have at least one registered.",
            "MISSING_COMPRESSION_PLUGINS"
        );
    }

    const getTenantId = (): string => {
        return context.tenancy.getCurrentTenant().id;
    };

    const getLocaleCode = (): string => {
        return context.i18nContent.getCurrentLocale().code;
    };

    /**
     * We need a data loader to fetch a page by id because it is being called a lot throughout the code.
     * This used to be more complex, with checks if it is preview mode and some others.
     * We do those checks after the page was loaded.
     */
    const dataLoaderGetById = new DataLoader<DataLoaderGetByIdKey, Page, string>(
        async keys => {
            const tenant = getTenantId();
            const locale = getLocaleCode();
            try {
                const pages: Page[] = [];
                for (const key of keys) {
                    const { id, version } = parseIdentifier(key.id);
                    const where: PageStorageOperationsGetWhereParams = {
                        pid: id,
                        version: version ? Number(version) : undefined,
                        latest: key.latest,
                        published: key.published,
                        tenant,
                        locale
                    };
                    const page: Page | null = await storageOperations.get({
                        where
                    });
                    pages.push(page);
                }
                return pages;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || `Could not load pages.`,
                    ex.code || "LOAD_PAGE_BY_IDS_ERROR",
                    {
                        keys
                    }
                );
            }
        },
        {
            cacheKeyFn: (key: DataLoaderGetByIdKey): string => {
                const tenant = getTenantId();
                const locale = getLocaleCode();
                const values: string[] = [tenant, locale, key.id];
                if (key.latest) {
                    values.push(`#l`);
                } else if (key.published) {
                    values.push("#p");
                }
                return values.join("#");
            }
        }
    );
    const clearDataLoaderCache = (pages: Page[]) => {
        for (const page of pages) {
            if (!page) {
                continue;
            }
            const keys = createDataLoaderKeys(page.id);
            for (const key of keys) {
                dataLoaderGetById.clear(key);
            }
        }
    };

    const onBeforePageCreate = createTopic<OnBeforePageCreateTopicParams>();
    const onAfterPageCreate = createTopic<OnAfterPageCreateTopicParams>();
    const onBeforePageCreateFrom = createTopic<OnBeforePageCreateFromTopicParams>();
    const onAfterPageCreateFrom = createTopic<OnAfterPageCreateFromTopicParams>();
    const onBeforePageUpdate = createTopic<OnBeforePageUpdateTopicParams>();
    const onAfterPageUpdate = createTopic<OnAfterPageUpdateTopicParams>();
    const onBeforePageDelete = createTopic<OnBeforePageDeleteTopicParams>();
    const onAfterPageDelete = createTopic<OnAfterPageDeleteTopicParams>();
    const onBeforePagePublish = createTopic<OnBeforePagePublishTopicParams>();
    const onAfterPagePublish = createTopic<OnAfterPagePublishTopicParams>();
    const onBeforePageUnpublish = createTopic<OnBeforePageUnpublishTopicParams>();
    const onAfterPageUnpublish = createTopic<OnAfterPageUnpublishTopicParams>();
    const onBeforePageRequestReview = createTopic<OnBeforePageRequestReviewTopicParams>();
    const onAfterPageRequestReview = createTopic<OnAfterPageRequestReviewTopicParams>();
    const onBeforePageRequestChanges = createTopic<OnBeforePageRequestChangesTopicParams>();
    const onAfterPageRequestChanges = createTopic<OnAfterPageRequestChangesTopicParams>();

    return {
        /**
         * Lifecycle events
         */
        onBeforePageCreate,
        onAfterPageCreate,
        onBeforePageCreateFrom,
        onAfterPageCreateFrom,
        onBeforePageUpdate,
        onAfterPageUpdate,
        onBeforePageDelete,
        onAfterPageDelete,
        onBeforePagePublish,
        onAfterPagePublish,
        onBeforePageUnpublish,
        onAfterPageUnpublish,
        onBeforePageRequestChanges,
        onAfterPageRequestChanges,
        onBeforePageRequestReview,
        onAfterPageRequestReview,
        /**
         * Storage operations
         */
        pageStorageOperations: storageOperations,
        async createPage(this: PageBuilderContextObject, slug) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const category = await this.getCategory(slug);
            if (!category) {
                throw new NotFoundError(`Category with slug "${slug}" not found.`);
            }

            const title = "Untitled";

            let pagePath = "";
            if (category.slug === "static") {
                pagePath = normalizePath("untitled-" + uniqid.time());
            } else {
                pagePath = normalizePath(
                    [category.url, "untitled-" + uniqid.time()].join("/").replace(/\/\//g, "/")
                );
            }

            const identity = context.security.getIdentity();
            new CreateDataModel().populate({ category: category.slug }).validate();

            const pageId = mdbid();
            const version = 1;

            const id = `${pageId}#${getZeroPaddedVersionNumber(version)}`;

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
            /**
             * Just create the initial { compression, content } object.
             */

            const page: Page = {
                id,
                pid: pageId,
                locale: context.i18nContent.getCurrentLocale().code,
                tenant: context.tenancy.getCurrentTenant().id,
                editor: DEFAULT_EDITOR,
                category: category.slug,
                title,
                path: pagePath,
                version,
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
                content: null,
                webinyVersion: context.WEBINY_VERSION
            };
            page.content = await compressContent(contentCompressionPlugins, page);

            try {
                await onBeforePageCreate.publish({
                    page
                });

                const result = await storageOperations.create({
                    input: {
                        slug
                    },
                    page
                });
                await onAfterPageCreate.publish({
                    page: result
                });
                return (await extractPageContent(contentCompressionPlugins, page)) as any;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create new page.",
                    ex.code || "CREATE_PAGE_ERROR",
                    {
                        ...(ex.data || {}),
                        page
                    }
                );
            }
        },

        async createPageFrom(this: PageBuilderContextObject, id) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            const original = await this.getPage(id, {
                decompress: false
            });

            if (!original) {
                throw new NotFoundError(`Page not found.`);
            }

            /**
             * Must not be able to create a new page (revision) from a page of another author.
             */
            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, original, "ownedBy");

            const latestPage = await storageOperations.get({
                where: {
                    pid: original.pid,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    latest: true
                }
            });

            if (!latestPage) {
                throw new NotFoundError("Missing latest page record.");
            }

            const version = latestPage.version + 1;

            const newId = `${original.pid}#${getZeroPaddedVersionNumber(version)}`;

            const page: Page = {
                ...original,
                id: newId,
                status: STATUS_DRAFT,
                locked: false,
                publishedOn: null,
                version,
                savedOn: new Date().toISOString(),
                createdFrom: id,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                }
            };

            try {
                await onBeforePageCreateFrom.publish({
                    original,
                    page
                });

                const result = await storageOperations.createFrom({
                    original,
                    latestPage,
                    page
                });
                await onAfterPageCreateFrom.publish({
                    original,
                    page: result
                });
                /**
                 * Clear the dataLoader cache.
                 */
                clearDataLoaderCache([original, page, latestPage]);
                return (await extractPageContent(contentCompressionPlugins, page)) as any;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create from existing page.",
                    ex.code || "CREATE_FROM_PAGE_ERROR",
                    {
                        ...(ex.data || {}),
                        id,
                        latestPage,
                        original,
                        page
                    }
                );
            }
        },

        async updatePage(id, input) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            const original = await storageOperations.get({
                where: {
                    id,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            });
            if (!original) {
                throw new NotFoundError("Non-existing-page.");
            }
            if (original.locked) {
                throw new WebinyError(`Cannot update page because it's locked.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, original, "ownedBy");

            const page: Page = {
                ...original,
                ...input,
                version: Number(original.version),
                savedOn: new Date().toISOString()
            };
            const newContent = input.content;
            if (newContent) {
                page.content = await compressContent(contentCompressionPlugins, {
                    ...page,
                    content: newContent
                });
            }

            try {
                await onBeforePageUpdate.publish({
                    original,
                    page,
                    input
                });

                const result = await storageOperations.update({
                    input,
                    original,
                    page
                });

                await onBeforePageUpdate.publish({
                    original,
                    page: result,
                    input
                });

                /**
                 * Clear the dataLoader cache.
                 */
                clearDataLoaderCache([original, page]);

                return {
                    ...result,
                    content:
                        newContent || (await extractContent(contentCompressionPlugins, original))
                } as any;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update existing page.",
                    ex.code || "UPDATE_PAGE_ERROR",
                    {
                        ...(ex.data || {}),
                        page,
                        original,
                        input
                    }
                );
            }
        },

        async deletePage(this: PageBuilderContextObject, id) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            /*
                ***** Comments left from the old code. These are the steps that need to happen for delete to work properly

                1. Load the page and latest / published page (rev) data.

                2. Do a couple of checks.

                3. Let's start updating. But first, let's trigger before-delete hook callbacks.

                Before we continue, note that if `publishedPageData` exists, then `publishedPagePathData`
                also exists. And to delete it, we can read `publishedPageData.path` to get its SK.
                There can't be a situation where just one record exists, there's always gonna be both.

                If we are deleting the initial version, we need to remove all versions and all of the meta data.

                4.1. We delete pages in batches of 15.

                4.2. Finally, delete data from ES.


                5. If we are deleting a specific version (version > 1)...

                6.1. Delete the actual page entry.

                6.2. If the page is published, remove published data, both from DB and ES

                6.3. If the page is latest, assign the previously latest page as the new latest.
                Updates must be made again both on DB and ES side.

            */

            const page = await storageOperations.get({
                where: {
                    id,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            });
            if (!page) {
                throw new NotFoundError("Non-existing page.");
            }

            const [pageId] = id.split("#");

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, page, "ownedBy");

            const settings = await this.getCurrentSettings();
            const pages = settings && settings.pages ? settings.pages : {};
            for (const key in pages) {
                // We don't allow delete operation for "published" version of special pages.
                if (pages[key] === page.pid && page.status === "published") {
                    throw new WebinyError(
                        `Cannot delete page because it's set as ${key}.`,
                        "DELETE_PAGE_ERROR"
                    );
                }
            }

            let latestPage = await storageOperations.get({
                where: {
                    pid: pageId,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    latest: true
                }
            });
            const publishedPage = await storageOperations.get({
                where: {
                    pid: pageId,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    published: true
                }
            });
            /**
             * We can either delete all of the records connected to given page or single revision.
             */
            const deleteMethod = page.version === 1 ? "deleteAll" : "delete";

            try {
                await onBeforePageDelete.publish({
                    page,
                    latestPage,
                    publishedPage
                });

                const [resultPage, resultLatestPage] = await storageOperations[deleteMethod]({
                    page,
                    publishedPage,
                    latestPage
                });
                latestPage = resultLatestPage || latestPage;

                await onAfterPageDelete.publish({
                    page: resultPage,
                    latestPage: resultLatestPage,
                    publishedPage
                });

                /**
                 * Clear the dataLoader cache.
                 */
                clearDataLoaderCache([page, publishedPage, latestPage]);
                /**
                 * 7. Done. We return both the deleted page, and the new latest one (if there is one).
                 */
                if (page.version === 1) {
                    return [
                        await extractPageContent(contentCompressionPlugins, resultPage),
                        null
                    ] as any;
                }
                return [
                    await extractPageContent(contentCompressionPlugins, resultPage),
                    await extractPageContent(contentCompressionPlugins, latestPage)
                ] as any;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete page.",
                    ex.code || "DELETE_PAGE_ERROR",
                    {
                        ...(ex.data || {}),
                        id,
                        page,
                        publishedPage,
                        latestPage
                    }
                );
            }
        },

        async publishPage(this: PageBuilderContextObject, id: string) {
            await checkBasePermissions<PageSecurityPermission>(context, PERMISSION_NAME, {
                pw: "p"
            });

            const original = await this.getPage(id, {
                decompress: false
            });

            if (original.status === STATUS_PUBLISHED) {
                throw new NotFoundError(`Page is already published.`);
            }
            /**
             * Already published page revision of this page.
             */
            const publishedPage = await storageOperations.get({
                where: {
                    pid: original.pid,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    published: true
                }
            });
            /**
             * We need a page that is published on given path.
             */
            const publishedPathPage = await storageOperations.get({
                where: {
                    path: original.path,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    published: true
                }
            });
            /**
             * Latest revision of this page.
             */
            const latestPage = await storageOperations.get({
                where: {
                    pid: original.pid,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    latest: true
                }
            });
            /**
             * If this is true, let's unpublish the page first. Note that we're not talking about this
             * same page, but a previous revision. We're talking about a completely different page
             * (with different PID). Remember that page ID equals `PID#version`.
             */
            if (publishedPathPage && publishedPathPage.pid !== original.pid) {
                /**
                 * Note two things here...
                 * 1) It is possible that this call is about to try to unpublish a page that is set as
                 * a special page (home / 404). In that case, this whole process will fail, and that
                 * is to be expected. Maybe we could think of a better solution in the future, but for
                 * now, it works like this. If there was only more ⏱.
                 * 2) If a user doesn't have the unpublish permission, again, the whole action will fail.
                 */
                await this.unpublishPage(publishedPathPage.id);
            }

            const page: Page = {
                ...original,
                status: STATUS_PUBLISHED,
                locked: true,
                savedOn: new Date().toISOString(),
                publishedOn: new Date().toISOString()
            };

            try {
                await onBeforePagePublish.publish({
                    page,
                    latestPage,
                    publishedPage
                });

                const result = await storageOperations.publish({
                    original,
                    page,
                    latestPage,
                    publishedPage,
                    publishedPathPage
                });

                await onAfterPagePublish.publish({
                    page: result,
                    latestPage,
                    publishedPage
                });

                /**
                 * Clear the dataLoader cache.
                 * We need to clear cache for original publish, latest and path page.
                 */
                clearDataLoaderCache([
                    original,
                    result,
                    latestPage,
                    publishedPage,
                    publishedPathPage
                ]);
                return (await extractPageContent(contentCompressionPlugins, result)) as any;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not publish page.",
                    ex.code || "PUBLISH_PAGE_ERROR",
                    {
                        id,
                        original,
                        page,
                        latestPage,
                        publishedPage,
                        publishedPathPage
                    }
                );
            }
        },

        async unpublishPage(this: PageBuilderContextObject, id: string) {
            await checkBasePermissions<PageSecurityPermission>(context, PERMISSION_NAME, {
                pw: "u"
            });

            const original = await this.getPage(id, {
                decompress: false
            });
            /**
             * Latest revision of the this page.
             */
            const latestPage = await storageOperations.get({
                where: {
                    pid: original.pid,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    latest: true
                }
            });

            if (original.status !== "published") {
                throw new WebinyError(`Page is not published.`);
            }

            const settings = await this.getCurrentSettings();
            const pages = settings && settings.pages ? settings.pages : {};
            for (const key in pages) {
                if (pages[key] === original.pid) {
                    throw new WebinyError(
                        `Cannot unpublish page because it's set as ${key}.`,
                        "UNPUBLISH_PAGE_ERROR"
                    );
                }
            }

            const page: Page = {
                ...original,
                status: STATUS_UNPUBLISHED,
                savedOn: new Date().toISOString()
            };

            try {
                await onBeforePageUnpublish.publish({
                    page
                });

                const result = await storageOperations.unpublish({
                    original,
                    page,
                    latestPage
                });
                await onAfterPageUnpublish.publish({
                    page: result
                });

                clearDataLoaderCache([original, latestPage]);
                return (await extractPageContent(contentCompressionPlugins, result)) as any;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not unpublish page.",
                    ex.code || "UNPUBLISH_PAGE_ERROR",
                    {
                        ...(ex.data || {}),
                        id,
                        original,
                        page,
                        latestPage
                    }
                );
            }
        },

        async requestPageReview(this: PageBuilderContextObject, id: string) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                pw: "r"
            });

            const original = await this.getPage(id, {
                decompress: false
            });

            const allowedStatuses = [STATUS_DRAFT, STATUS_CHANGES_REQUESTED];
            if (!allowedStatuses.includes(original.status)) {
                throw new WebinyError(
                    `Cannot request review - page is not a draft nor a change request has been issued.`,
                    "REQUEST_REVIEW_ERROR"
                );
            }
            /**
             * Latest revision of the this page.
             */
            const latestPage = await storageOperations.get({
                where: {
                    pid: original.pid,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    latest: true
                }
            });

            const page: Page = {
                ...original,
                status: STATUS_REVIEW_REQUESTED,
                locked: true,
                savedOn: new Date().toISOString()
            };

            try {
                const result: any = await storageOperations.requestReview({
                    original,
                    page,
                    latestPage
                });
                clearDataLoaderCache([original, latestPage]);
                return (await extractPageContent(contentCompressionPlugins, result)) as any;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not request review for the page.",
                    ex.code || "REQUEST_REVIEW_ERROR",
                    {
                        id,
                        original,
                        page,
                        latestPage
                    }
                );
            }
        },

        async requestPageChanges(this: PageBuilderContextObject, id: string) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                pw: "c"
            });

            const original = await this.getPage(id, {
                decompress: false
            });
            if (original.status !== STATUS_REVIEW_REQUESTED) {
                throw new WebinyError(
                    `Cannot request changes on a page that's not under review.`,
                    "REQUESTED_CHANGES_ON_PAGE_REVISION_NOT_UNDER_REVIEW"
                );
            }
            const identity = context.security.getIdentity();
            if (original.createdBy.id === identity.id) {
                throw new WebinyError(
                    "Cannot request changes on page revision you created.",
                    "REQUESTED_CHANGES_ON_PAGE_REVISION_YOU_CREATED"
                );
            }
            /**
             * Latest revision of the this page.
             */
            const latestPage = await storageOperations.get({
                where: {
                    pid: original.pid,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    latest: true
                }
            });

            const page: Page = {
                ...original,
                status: STATUS_CHANGES_REQUESTED,
                locked: false
            };
            try {
                const result: any = await storageOperations.requestChanges({
                    original,
                    page,
                    latestPage
                });
                clearDataLoaderCache([original, latestPage]);
                return (await extractPageContent(contentCompressionPlugins, result)) as any;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not request review for the page.",
                    ex.code || "REQUEST_REVIEW_ERROR",
                    {
                        id,
                        original,
                        page,
                        latestPage
                    }
                );
            }
        },

        async getPage(id, options) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            let page: Page = null;

            try {
                page = await dataLoaderGetById.load({
                    id
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Cannot get requested page.",
                    ex.code || "GET_PAGE_ERROR",
                    {
                        id
                    }
                );
            }
            if (!page) {
                throw new NotFoundError(`Page not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, page, "ownedBy");

            if (options && options.decompress === false) {
                return page;
            }

            return (await extractPageContent(contentCompressionPlugins, page)) as any;
        },

        async getPublishedPageById(this: PageBuilderContextObject, params) {
            const { id, preview } = params;

            let page: Page = null;

            try {
                page = await dataLoaderGetById.load({
                    id,
                    published: preview === true ? undefined : true
                });
                if (page && preview !== true && page.status !== STATUS_PUBLISHED) {
                    page = null;
                }
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Cannot get requested page.",
                    ex.code || "GET_PAGE_ERROR",
                    {
                        ...(ex.data || {}),
                        id
                    }
                );
            }
            if (!page) {
                throw new NotFoundError(`Page not found.`);
            }

            return (await extractPageContent(contentCompressionPlugins, page)) as any;
        },

        async getPublishedPageByPath(this: PageBuilderContextObject, params) {
            if (!params.path) {
                throw new WebinyError(
                    'Cannot get published page - "path" not provided.',
                    "GET_PUBLISHED_PATH_ERROR"
                );
            }

            const normalizedPath = normalizePath(params.path);
            if (normalizedPath === "/") {
                const settings = await this.getCurrentSettings();
                const homePage = lodashGet(settings, "pages.home");
                if (!homePage) {
                    throw new NotFoundError("Page not found.");
                }

                return await this.getPublishedPageById({
                    id: homePage
                });
            }

            let page: Page = undefined;

            try {
                page = await storageOperations.get({
                    where: {
                        path: normalizedPath,
                        tenant: getTenantId(),
                        locale: getLocaleCode(),
                        published: true
                    }
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get published page by path.",
                    ex.code || "GET_PUBLISHED_PAGE_BY_PATH_ERROR",
                    {
                        ...(ex.data || {}),
                        path: normalizedPath
                    }
                );
            }

            if (!page) {
                /**
                 * Try loading dynamic pages.
                 * TODO: @pavel do this some other way possibly?
                 * TODO: There are no more events in PagePlugin, so maybe produce some other kind of plugin
                 * TODO: that will only do stuff related to dynamic pages?
                 */
                for (const plugin of pagePlugins) {
                    if (typeof plugin.notFound === "function") {
                        page = await plugin.notFound({ args: params, context });
                        if (page) {
                            break;
                        }
                    }
                }
            }

            if (page) {
                /**
                 * Extract compressed page content.
                 */
                return (await extractPageContent(contentCompressionPlugins, page)) as any;
            }

            throw new NotFoundError("Page not found.");
        },

        async listLatestPages(params, options = {}) {
            const { auth } = options;
            let permission: { own?: boolean } = null;
            if (auth !== false) {
                permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "r"
                });
            }

            const { after, limit, sort, search, exclude, where: initialWhere = {} } = params;

            /**
             * If users can only manage own records, let's add the special filter.
             */
            let createdBy: string = undefined;
            if (permission && permission.own === true) {
                const identity = context.security.getIdentity();
                createdBy = identity.id;
            }

            const { paths: pathNotIn, ids: pidNotIn } = createNotIn(exclude);
            const { tags } = initialWhere;
            delete initialWhere["tags"];

            const listParams: PageStorageOperationsListParams = {
                limit,
                sort: createSort(sort),
                where: {
                    ...initialWhere,
                    latest: true,
                    search: search ? search.query : undefined,
                    createdBy,
                    path_not_in: pathNotIn,
                    pid_not_in: pidNotIn,
                    tags_in: tags && tags.query ? tags.query : undefined,
                    tags_rule: tags && tags.rule ? tags.rule : undefined,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                },
                after
            };

            try {
                const { items, meta } = await storageOperations.list(listParams);

                return [
                    items as any[],
                    {
                        ...meta,
                        cursor: meta.hasMoreItems ? meta.cursor : null
                    }
                ];
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list latest pages.",
                    ex.code || "LIST_LATEST_PAGES_ERROR",
                    {
                        ...(ex.data || {}),
                        params: listParams
                    }
                );
            }
        },

        async listPublishedPages(params) {
            const { after, limit, sort, search, exclude, where: initialWhere = {} } = params;

            const { paths: pathNotIn, ids: pidNotIn } = createNotIn(exclude);

            const { tags } = initialWhere;
            delete initialWhere["tags"];

            const listParams: PageStorageOperationsListParams = {
                limit,
                sort: createSort(sort),
                where: {
                    ...initialWhere,
                    published: true,
                    search: search && search.query ? search.query : undefined,
                    path_not_in: pathNotIn,
                    pid_not_in: pidNotIn,
                    tags_in: tags && tags.query ? tags.query : undefined,
                    tags_rule: tags && tags.rule ? tags.rule : undefined,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                },
                after
            };

            try {
                const { items, meta } = await storageOperations.list(listParams);

                return [
                    items as any[],
                    {
                        ...meta,
                        cursor: meta.hasMoreItems ? meta.cursor : null
                    }
                ];
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list published pages.",
                    ex.code || "LIST_PUBLISHED_PAGES_ERROR",
                    {
                        ...(ex.data || {}),
                        params: listParams
                    }
                );
            }
        },

        async listPageRevisions(pageId) {
            const [pid] = pageId.split("#");

            try {
                const pages = await storageOperations.listRevisions({
                    where: {
                        pid,
                        tenant: getTenantId(),
                        locale: getLocaleCode()
                    },
                    /**
                     * Let's hope there will be no more than 10000 revisions.
                     * Need to implement "after" option if required.
                     */
                    limit: 10000,
                    after: undefined
                });
                return pages as any[];
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load all the revisions from requested page.",
                    ex.code || "LIST_PAGE_REVISIONS_ERROR",
                    {
                        ...(ex.data || {}),
                        pageId
                    }
                );
            }
        },

        async listPagesTags(params) {
            const search = params && params.search ? params.search.query : "";
            if (search.length < 2) {
                throw new WebinyError("Please provide at least two characters.", "LIST_TAGS_ERROR");
            }

            const listTagsParams: PageStorageOperationsListTagsParams = {
                where: {
                    tenant: context.tenancy.getCurrentTenant().id,
                    locale: context.i18nContent.getCurrentLocale().code,
                    search
                }
            };

            try {
                return await storageOperations.listTags(listTagsParams);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load all tags by given params.",
                    ex.code || "LIST_TAGS_ERROR",
                    {
                        ...(ex.data || {}),
                        params: listTagsParams
                    }
                );
            }
        },
        prerendering: {
            flush: async (args: FlushParams) => {
                return args.context.pageBuilder.getPrerenderingHandlers().flush(args);
            },
            render: async (args: RenderParams) => {
                return args.context.pageBuilder.getPrerenderingHandlers().render(args);
            }
        }
    };
};
