import mdbid from "mdbid";
import uniqid from "uniqid";
import lodashGet from "lodash/get";
import DataLoader from "dataloader";
import { NotFoundError } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import {
    Page,
    PageSecurityPermission,
    PageStorageOperations,
    PageStorageOperationsListParams,
    PageStorageOperationsListTagsParams,
    PbContext
} from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import executeCallbacks from "./utils/executeCallbacks";
import normalizePath from "./pages/normalizePath";
import { compressContent, extractContent } from "./pages/contentCompression";
import { CreateDataModel, UpdateSettingsModel } from "./pages/models";
import { PagePlugin } from "~/plugins/PagePlugin";
import WebinyError from "@webiny/error";
import { PageStorageOperationsProviderPlugin } from "~/plugins/PageStorageOperationsProviderPlugin";
import lodashTrimEnd from "lodash/trimEnd";
import { createStorageOperations } from "./storageOperations";
import { getZeroPaddedVersionNumber } from "~/utils/zeroPaddedVersionNumber";
import {
    FlushParams,
    PrerenderingPagePlugin,
    RenderParams
} from "~/plugins/PrerenderingPagePlugin";
import { ContentCompressionPlugin } from "~/plugins/ContentCompressionPlugin";

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
    const [pid] = id.split("#");
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

export default new ContextPlugin<PbContext>(async context => {
    /**
     * If pageBuilder is not defined on the context, do not continue, but log it.
     */
    if (!context.pageBuilder) {
        console.log("Missing pageBuilder on context. Skipping Pages crud.");
        return;
    }

    const storageOperations = await createStorageOperations<PageStorageOperations>(
        context,
        PageStorageOperationsProviderPlugin.type
    );

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

    /**
     * We need a data loader to fetch a page by id because it is being called a lot throughout the code.
     * This used to be more complex, with checks if it is preview mode and some others.
     * We do those checks after the page was loaded.
     */
    const dataLoaderGetById = new DataLoader<DataLoaderGetByIdKey, Page, string>(
        async keys => {
            try {
                const pages: Page[] = [];
                for (const key of keys) {
                    const [pid, version] = key.id.split("#");
                    const where = {
                        pid,
                        version: version ? Number(version) : undefined,
                        latest: key.latest,
                        published: key.published
                    };
                    const page = await storageOperations.get({
                        where
                    });
                    if (!page) {
                        pages.push(null);
                        continue;
                    }
                    const newPage = await extractPageContent(contentCompressionPlugins, page);
                    pages.push(newPage);
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
                const values: string[] = [key.id];
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
    /**
     * We always take the last prerendering plugin.
     */
    const pagePrerenderingPlugin = context.plugins
        .byType<PrerenderingPagePlugin>(PrerenderingPagePlugin.type)
        .pop();

    context.pageBuilder.pages = {
        storageOperations,
        async create(slug) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const category = await context.pageBuilder.categories.get(slug);
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
                locale: context.i18nContent.getLocale().code,
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
                await executeCallbacks<PagePlugin["beforeCreate"]>(pagePlugins, "beforeCreate", {
                    context,
                    page
                });
                const result = await storageOperations.create({
                    input: {
                        slug
                    },
                    page
                });
                await executeCallbacks<PagePlugin["afterCreate"]>(pagePlugins, "afterCreate", {
                    context,
                    page: result
                });
                delete result.content;
                return result as any;
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

        async createFrom(id) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            const original = await context.pageBuilder.pages.get(id);

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
                await executeCallbacks<PagePlugin["beforeCreate"]>(pagePlugins, "beforeCreate", {
                    context,
                    page
                });
                const result = await storageOperations.createFrom({
                    original,
                    latestPage,
                    page
                });
                await executeCallbacks<PagePlugin["afterCreate"]>(pagePlugins, "afterCreate", {
                    page: result,
                    context
                });
                /**
                 * Clear the dataLoader cache.
                 */
                clearDataLoaderCache([original, page, latestPage]);
                return result as any;
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

        async update(id, input) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            const original = await storageOperations.get({
                where: {
                    id
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
                await executeCallbacks<PagePlugin["beforeUpdate"]>(pagePlugins, "beforeUpdate", {
                    context,
                    existingPage: original,
                    inputData: input,
                    updateData: page
                });
                const result = await storageOperations.update({
                    input,
                    original,
                    page
                });

                await executeCallbacks<PagePlugin["afterUpdate"]>(pagePlugins, "afterUpdate", {
                    context,
                    page: result,
                    inputData: input
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

        async delete(id) {
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
                    id
                }
            });
            if (!page) {
                throw new NotFoundError("Non-existing page.");
            }

            const [pageId] = id.split("#");

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, page, "ownedBy");

            const settings = await context.pageBuilder.settings.getCurrent();
            const pages = settings && settings.pages ? settings.pages : {};
            for (const key in pages) {
                if (pages[key] === page.pid) {
                    throw new WebinyError(
                        `Cannot delete page because it's set as ${key}.`,
                        "DELETE_PAGE_ERROR"
                    );
                }
            }

            let latestPage = await storageOperations.get({
                where: {
                    pid: pageId,
                    latest: true
                }
            });
            const publishedPage = await storageOperations.get({
                where: {
                    pid: pageId,
                    published: true
                }
            });
            /**
             * We can either delete all of the records connected to given page or single revision.
             */
            const deleteMethod = page.version === 1 ? "deleteAll" : "delete";

            try {
                await executeCallbacks<PagePlugin["beforeDelete"]>(pagePlugins, "beforeDelete", {
                    context,
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
                await executeCallbacks<PagePlugin["afterDelete"]>(pagePlugins, "afterDelete", {
                    context,
                    page: resultPage,
                    latestPage: latestPage,
                    publishedPage: publishedPage
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

        async publish(id: string) {
            await checkBasePermissions<PageSecurityPermission>(context, PERMISSION_NAME, {
                pw: "p"
            });

            const original = await context.pageBuilder.pages.get(id);

            if (original.status === STATUS_PUBLISHED) {
                throw new NotFoundError(`Page is already published.`);
            }
            /**
             * Already published page revision of this page.
             */
            const publishedPage = await storageOperations.get({
                where: {
                    pid: original.pid,
                    published: true
                }
            });
            /**
             * We need a page that is published on given path.
             */
            const publishedPathPage = await storageOperations.get({
                where: {
                    path: original.path,
                    published: true
                }
            });
            /**
             * Latest revision of this page.
             */
            const latestPage = await storageOperations.get({
                where: {
                    pid: original.pid,
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
                await context.pageBuilder.pages.unpublish(publishedPathPage.id);
            }

            const page: Page = {
                ...original,
                status: STATUS_PUBLISHED,
                locked: true,
                savedOn: new Date().toISOString(),
                publishedOn: new Date().toISOString()
            };

            try {
                await executeCallbacks<PagePlugin["beforePublish"]>(pagePlugins, "beforePublish", {
                    context,
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

                await executeCallbacks<PagePlugin["afterPublish"]>(pagePlugins, "afterPublish", {
                    context,
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
                return result as any;
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

        async unpublish(id: string) {
            await checkBasePermissions<PageSecurityPermission>(context, PERMISSION_NAME, {
                pw: "u"
            });

            const original = await context.pageBuilder.pages.get(id);
            /**
             * Latest revision of the this page.
             */
            const latestPage = await storageOperations.get({
                where: {
                    pid: original.pid,
                    latest: true
                }
            });

            if (original.status !== "published") {
                throw new WebinyError(`Page is not published.`);
            }

            const settings = await context.pageBuilder.settings.getCurrent();
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
                await executeCallbacks<PagePlugin["beforeUnpublish"]>(
                    pagePlugins,
                    "beforeUnpublish",
                    {
                        context,
                        page
                    }
                );
                const result = await storageOperations.unpublish({
                    original,
                    page,
                    latestPage
                });
                await executeCallbacks<PagePlugin["afterUnpublish"]>(
                    pagePlugins,
                    "afterUnpublish",
                    {
                        context,
                        page: result
                    }
                );
                clearDataLoaderCache([original, latestPage]);
                return result as any;
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

        async requestReview(id: string) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                pw: "r"
            });

            const original = await context.pageBuilder.pages.get(id);

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
                return result;
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

        async requestChanges(id: string) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                pw: "c"
            });

            const original = await context.pageBuilder.pages.get(id);
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
                return result;
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

        async get(id) {
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

            return page as any;
        },

        async getPublishedById(params) {
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

            return page as any;
        },

        async getPublishedByPath(params) {
            if (!params.path) {
                throw new WebinyError(
                    'Cannot get published page - "path" not provided.',
                    "GET_PUBLISHED_PATH_ERROR"
                );
            }

            const normalizedPath = normalizePath(params.path);
            if (normalizedPath === "/") {
                const settings = await context.pageBuilder.settings.getCurrent();
                const homePage = lodashGet(settings, "pages.home");
                if (!homePage) {
                    throw new NotFoundError("Page not found.");
                }

                return await context.pageBuilder.pages.getPublishedById({
                    id: homePage
                });
            }

            let page: Page = undefined;

            try {
                page = await storageOperations.get({
                    where: {
                        path: normalizedPath,
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
                 * Try loading dynamic pages
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

        async listLatest(params, options = {}) {
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
                    locale: context.i18nContent.getLocale().code,
                    createdBy,
                    path_not_in: pathNotIn,
                    pid_not_in: pidNotIn,
                    tags_in: tags && tags.query ? tags.query : undefined,
                    tags_rule: tags && tags.rule ? tags.rule : undefined
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

        async listPublished(params) {
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
                    locale: context.i18nContent.getLocale().code,
                    path_not_in: pathNotIn,
                    pid_not_in: pidNotIn,
                    tags_in: tags && tags.query ? tags.query : undefined,
                    tags_rule: tags && tags.rule ? tags.rule : undefined
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
                        pid
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

        async listTags(params) {
            const search = params && params.search ? params.search.query : "";
            if (search.length < 2) {
                throw new WebinyError("Please provide at least two characters.", "LIST_TAGS_ERROR");
            }

            const listTagsParams: PageStorageOperationsListTagsParams = {
                where: {
                    tenant: context.tenancy.getCurrentTenant().id,
                    locale: context.i18nContent.getLocale().code,
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
                if (!pagePrerenderingPlugin) {
                    return;
                }
                return pagePrerenderingPlugin.flush(args);
            },
            render: async (args: RenderParams) => {
                if (!pagePrerenderingPlugin) {
                    return;
                }
                return pagePrerenderingPlugin.render(args);
            }
        }
    };
});
