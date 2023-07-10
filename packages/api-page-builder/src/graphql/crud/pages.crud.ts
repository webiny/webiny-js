import uniqid from "uniqid";
import lodashGet from "lodash/get";
import DataLoader from "dataloader";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    CreatedBy,
    OnPageBeforeCreateTopicParams,
    Page,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PageElementProcessor,
    PagesCrud,
    PageStorageOperationsGetWhereParams,
    PageStorageOperationsListParams,
    PageStorageOperationsListTagsParams,
    PbContext
} from "~/types";
import normalizePath from "./pages/normalizePath";
import {
    createPageCreateValidation,
    createPageSettingsUpdateValidation,
    createPageUpdateValidation
} from "./pages/validation";
import { processPageContent } from "./pages/processPageContent";
import WebinyError from "@webiny/error";
import lodashTrimEnd from "lodash/trimEnd";
import {
    FlushParams,
    OnPageAfterCreateFromTopicParams,
    OnPageAfterCreateTopicParams,
    OnPageAfterDeleteTopicParams,
    OnPageAfterPublishTopicParams,
    OnPageAfterUnpublishTopicParams,
    OnPageAfterUpdateTopicParams,
    OnPageBeforeCreateFromTopicParams,
    OnPageBeforeDeleteTopicParams,
    OnPageBeforePublishTopicParams,
    OnPageBeforeUnpublishTopicParams,
    OnPageBeforeUpdateTopicParams,
    RenderParams
} from "~/graphql/types";
import { createTopic } from "@webiny/pubsub";
import {
    mdbid,
    createIdentifier,
    createZodError,
    parseIdentifier,
    removeNullValues,
    removeUndefinedValues,
    zeroPad
} from "@webiny/utils";
import { createCompression } from "~/graphql/crud/pages/compression";
import { PagesPermissions } from "./permissions/PagesPermissions";

const STATUS_DRAFT = "draft";
const STATUS_PUBLISHED = "published";
const STATUS_UNPUBLISHED = "unpublished";

const DEFAULT_EDITOR = "page-builder";

interface DataLoaderGetByIdKey {
    id: string;
    latest?: boolean;
    published?: boolean;
}

interface NotInResult {
    paths: string[] | undefined;
    ids: string[] | undefined;
}

const createNotIn = (exclude?: string[]): NotInResult => {
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

const createSort = (sort?: string[]): string[] => {
    if (!sort || Array.isArray(sort) === false || sort.length === 0) {
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

export interface CreatePageCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    pagesPermissions: PagesPermissions;
    getTenantId: () => string;
    getLocaleCode: () => string;
}

export const createPageCrud = (params: CreatePageCrudParams): PagesCrud => {
    const { context, storageOperations, getLocaleCode, getTenantId, pagesPermissions } = params;

    const { compressContent, decompressContent } = createCompression({
        plugins: context.plugins
    });

    /**
     * We need a data loader to fetch a page by id because it is being called a lot throughout the code.
     * This used to be more complex, with checks if it is preview mode and some others.
     * We do those checks after the page was loaded.
     */
    const dataLoaderGetById = new DataLoader<DataLoaderGetByIdKey, Page | null, string>(
        async keys => {
            const tenant = getTenantId();
            const locale = getLocaleCode();
            try {
                const pages: (Page | null)[] = [];
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
                    const page: Page | null = await storageOperations.pages.get({
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
    const clearDataLoaderCache = (pages: (Page | null)[]) => {
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

    // create
    const onPageBeforeCreate = createTopic<OnPageBeforeCreateTopicParams>(
        "pageBuilder.onPageBeforeCreate"
    );
    const onPageAfterCreate = createTopic<OnPageAfterCreateTopicParams>(
        "pageBuilder.onPageAfterCreate"
    );
    // create from
    const onPageBeforeCreateFrom = createTopic<OnPageBeforeCreateFromTopicParams>(
        "pageBuilder.onPageBeforeCreateFrom"
    );
    const onPageAfterCreateFrom = createTopic<OnPageAfterCreateFromTopicParams>(
        "pageBuilder.onPageAfterCreateFrom"
    );
    // update
    const onPageBeforeUpdate = createTopic<OnPageBeforeUpdateTopicParams>(
        "pageBuilder.onPageBeforeUpdate"
    );
    const onPageAfterUpdate = createTopic<OnPageAfterUpdateTopicParams>(
        "pageBuilder.onPageAfterUpdate"
    );
    // delete
    const onPageBeforeDelete = createTopic<OnPageBeforeDeleteTopicParams>(
        "pageBuilder.onPageBeforeDelete"
    );
    const onPageAfterDelete = createTopic<OnPageAfterDeleteTopicParams>(
        "pageBuilder.onPageAfterDelete"
    );
    // publish
    const onPageBeforePublish = createTopic<OnPageBeforePublishTopicParams>(
        "pageBuilder.onPageBeforePublish"
    );
    const onPageAfterPublish = createTopic<OnPageAfterPublishTopicParams>(
        "pageBuilder.onPageAfterPublish"
    );
    // unpublish
    const onPageBeforeUnpublish = createTopic<OnPageBeforeUnpublishTopicParams>(
        "pageBuilder.onPageBeforeUnpublish"
    );
    const onPageAfterUnpublish = createTopic<OnPageAfterUnpublishTopicParams>(
        "pageBuilder.onPageAfterUnpublish"
    );

    const pageElementProcessors: PageElementProcessor[] = [];

    return {
        /**
         * Lifecycle events - deprecated in 5.34.0 - will be removed in 5.36.0
         */
        onBeforePageCreate: onPageBeforeCreate,
        onAfterPageCreate: onPageAfterCreate,
        onBeforePageCreateFrom: onPageBeforeCreateFrom,
        onAfterPageCreateFrom: onPageAfterCreateFrom,
        onBeforePageUpdate: onPageBeforeUpdate,
        onAfterPageUpdate: onPageAfterUpdate,
        onBeforePageDelete: onPageBeforeDelete,
        onAfterPageDelete: onPageAfterDelete,
        onBeforePagePublish: onPageBeforePublish,
        onAfterPagePublish: onPageAfterPublish,
        onBeforePageUnpublish: onPageBeforeUnpublish,
        onAfterPageUnpublish: onPageAfterUnpublish,
        /**
         * Introduced in 5.34.0
         */
        onPageBeforeCreate,
        onPageAfterCreate,
        onPageBeforeCreateFrom,
        onPageAfterCreateFrom,
        onPageBeforeUpdate,
        onPageAfterUpdate,
        onPageBeforeDelete,
        onPageAfterDelete,
        onPageBeforePublish,
        onPageAfterPublish,
        onPageBeforeUnpublish,
        onPageAfterUnpublish,
        addPageElementProcessor(processor) {
            pageElementProcessors.push(processor);
        },
        async processPageContent(page) {
            return processPageContent(page, pageElementProcessors);
        },
        async createPage(this: PageBuilderContextObject, slug, meta): Promise<any> {
            await pagesPermissions.ensure({ rwd: "w" });

            const category = await this.getCategory(slug);
            if (!category) {
                throw new NotFoundError(`Category with slug "${slug}" not found.`);
            }

            const title = "Untitled";

            let pagePath = "";
            if (category.slug === "static") {
                pagePath = normalizePath("untitled-" + uniqid.time()) as string;
            } else {
                pagePath = normalizePath(
                    [category.url, "untitled-" + uniqid.time()].join("/").replace(/\/\//g, "/")
                ) as string;
            }

            const identity = context.security.getIdentity();

            const result = await createPageCreateValidation().safeParseAsync({
                category: category.slug
            });
            if (!result.success) {
                throw createZodError(result.error);
            }

            const pageId = mdbid();
            const version = 1;

            const id = createIdentifier({
                id: pageId,
                version
            });

            const updateSettingsValidationResult =
                await createPageSettingsUpdateValidation().safeParseAsync({
                    general: {
                        layout: category.layout
                    },
                    social: {
                        description: null,
                        image: null,
                        meta: [],
                        title: null
                    },
                    seo: {
                        title: null,
                        description: null,
                        meta: []
                    }
                });
            if (!updateSettingsValidationResult.success) {
                throw createZodError(updateSettingsValidationResult.error);
            }

            const settings = updateSettingsValidationResult.data;

            const owner: CreatedBy = {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            };

            const page: Page = {
                id,
                pid: pageId,
                locale: getLocaleCode(),
                tenant: getTenantId(),
                editor: DEFAULT_EDITOR,
                category: category.slug,
                title,
                path: pagePath,
                version,
                status: STATUS_DRAFT,
                locked: false,
                publishedOn: null,
                createdFrom: null,
                settings: {
                    ...settings,
                    general: {
                        ...settings.general,
                        tags: settings.general?.tags || undefined
                    },
                    social: {
                        ...settings.social,
                        meta: settings.social?.meta || []
                    },
                    seo: {
                        ...settings.seo,
                        meta: settings.seo?.meta || []
                    }
                },
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString(),
                ownedBy: owner,
                createdBy: owner,
                content: null,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onPageBeforeCreate.publish({
                    page,
                    meta
                });

                page.content = await compressContent(page);

                const result = await storageOperations.pages.create({
                    input: {
                        slug
                    },
                    page
                });
                await onPageAfterCreate.publish({
                    page: result,
                    meta
                });

                return {
                    ...result,
                    content: await decompressContent(result)
                };
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

        async createPageFrom(this: PageBuilderContextObject, id): Promise<any> {
            await pagesPermissions.ensure({ rwd: "w" });

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

            await pagesPermissions.ensure({ owns: original?.createdBy });

            const latestPage = await storageOperations.pages.get({
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

            const newId = `${original.pid}#${zeroPad(version)}`;

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
                await onPageBeforeCreateFrom.publish({
                    original,
                    page
                });

                const result = await storageOperations.pages.createFrom({
                    original,
                    latestPage,
                    page
                });
                await onPageAfterCreateFrom.publish({
                    original,
                    page: result
                });
                /**
                 * Clear the dataLoader cache.
                 */
                clearDataLoaderCache([original, page, latestPage]);
                return {
                    ...result,
                    content: await decompressContent(result)
                };
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

        async updatePage(id, input): Promise<any> {
            await pagesPermissions.ensure({ rwd: "w" });

            const original = await storageOperations.pages.get({
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

            await pagesPermissions.ensure({ owns: original?.ownedBy });

            const result = await createPageUpdateValidation().safeParseAsync(input);
            if (!result.success) {
                throw createZodError(result.error);
            }

            const data = removeNullValues(removeUndefinedValues(result.data));

            const page: Page = {
                ...original,
                ...data,
                settings: {
                    ...original.settings,
                    ...(data.settings || {}),
                    seo: {
                        ...(data.settings?.seo || {}),
                        meta: data.settings?.seo?.meta || []
                    },
                    social: {
                        ...(data.settings?.social || {}),
                        meta: data.settings?.social?.meta || []
                    }
                },
                version: Number(original.version),
                savedOn: new Date().toISOString()
            };
            const newContent = data.content;
            if (newContent) {
                page.content = await compressContent({
                    ...page,
                    content: newContent
                });
            }

            try {
                await onPageBeforeUpdate.publish({
                    original,
                    page,
                    input
                });

                const result = await storageOperations.pages.update({
                    input,
                    original,
                    page
                });

                await onPageAfterUpdate.publish({
                    original,
                    page: result,
                    input
                });

                /**
                 * Clear the dataLoader cache.
                 */
                clearDataLoaderCache([original, page]);
                /**
                 * If we have new content, return that.
                 */
                if (newContent) {
                    return {
                        ...result,
                        content: newContent
                    };
                }
                /**
                 * Otherwise decompress original content and return with new page.
                 */
                return {
                    ...result,
                    content: await decompressContent(original)
                };
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
            await pagesPermissions.ensure({ rwd: "d" });

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

            const page = await storageOperations.pages.get({
                where: {
                    id,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            });
            if (!page) {
                throw new NotFoundError("Non-existing page.");
            }

            const { id: pageId } = parseIdentifier(id);

            await pagesPermissions.ensure({ owns: page.ownedBy });

            const settings = await this.getCurrentSettings();
            const pages = settings?.pages || {};
            for (const key in pages) {
                // We don't allow delete operation for "published" version of special pages.
                const value = pages[key as keyof typeof pages];
                if (value === page.pid && page.status === "published") {
                    throw new WebinyError(
                        `Cannot delete page because it's set as ${key}.`,
                        "DELETE_PAGE_ERROR"
                    );
                }
            }

            let latestPage = await storageOperations.pages.get({
                where: {
                    pid: pageId,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    latest: true
                }
            });
            if (!latestPage) {
                throw new WebinyError("Missing latest page record.", "LATEST_PAGE_RECORD", {
                    pid: pageId,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                });
            }
            const publishedPage = await storageOperations.pages.get({
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
            const deleteMethod: "deleteAll" | "delete" =
                page.version === 1 ? "deleteAll" : "delete";

            if (typeof storageOperations.pages[deleteMethod] !== "function") {
                throw new WebinyError(
                    `Missing delete function on storageOperations.pages object.`,
                    "MISSING_DELETE_METHOD",
                    {
                        deleteMethod
                    }
                );
            }

            try {
                await onPageBeforeDelete.publish({
                    page,
                    latestPage,
                    publishedPage
                });

                const [resultPage, resultLatestPage] = await storageOperations.pages[deleteMethod]({
                    page,
                    publishedPage,
                    latestPage
                });
                latestPage = resultLatestPage || latestPage;

                await onPageAfterDelete.publish({
                    page: resultPage,
                    latestPage: resultLatestPage || null,
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
                        {
                            ...resultPage,
                            content: await decompressContent(resultPage)
                        },
                        null
                    ] as any;
                }
                return [
                    {
                        ...resultPage,
                        content: await decompressContent(resultPage)
                    },
                    {
                        ...latestPage,
                        content: await decompressContent(latestPage)
                    }
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

        async publishPage(this: PageBuilderContextObject, id: string): Promise<any> {
            await pagesPermissions.ensure({ pw: "p" });

            const original = await this.getPage(id, {
                decompress: false
            });

            if (original.status === STATUS_PUBLISHED) {
                throw new NotFoundError(`Page is already published.`);
            }
            /**
             * Already published page revision of this page.
             */
            const publishedPage = await storageOperations.pages.get({
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
            const publishedPathPage = await storageOperations.pages.get({
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
            const latestPageWhere: PageStorageOperationsGetWhereParams = {
                pid: original.pid,
                tenant: original.tenant,
                locale: original.locale,
                latest: true
            };
            /**
             * Latest revision of this page.
             */
            const latestPage = await storageOperations.pages.get({
                where: latestPageWhere
            });
            if (!latestPage) {
                throw new WebinyError(
                    "Missing latest page record of the requested page. This should never happen.",
                    "LATEST_PAGE_ERROR",
                    latestPageWhere
                );
            }
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
                await onPageBeforePublish.publish({
                    page,
                    latestPage,
                    publishedPage
                });

                const result = await storageOperations.pages.publish({
                    original,
                    page,
                    latestPage,
                    publishedPage,
                    publishedPathPage
                });

                await onPageAfterPublish.publish({
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
                return {
                    ...result,
                    content: await decompressContent(result)
                };
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

        async unpublishPage(this: PageBuilderContextObject, id: string): Promise<any> {
            await pagesPermissions.ensure({ pw: "u" });

            const original = await this.getPage(id, {
                decompress: false
            });
            /**
             * Latest revision of the this page.
             */
            const latestPage = await storageOperations.pages.get({
                where: {
                    pid: original.pid,
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    latest: true
                }
            });
            if (!latestPage) {
                throw new WebinyError(
                    "Could not find latest revision of the page.",
                    "LATEST_PAGE_REVISION_ERROR",
                    {
                        pid: original.pid,
                        tenant: getTenantId(),
                        locale: getLocaleCode()
                    }
                );
            }

            if (original.status !== "published") {
                throw new WebinyError(`Page is not published.`);
            }

            const settings = await this.getCurrentSettings();
            const pages = settings?.pages || {};
            for (const key in pages) {
                const value = pages[key as keyof typeof pages];
                if (value === original.pid) {
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
                await onPageBeforeUnpublish.publish({
                    page,
                    latestPage
                });

                const result = await storageOperations.pages.unpublish({
                    original,
                    page,
                    latestPage
                });
                await onPageAfterUnpublish.publish({
                    page: result,
                    latestPage
                });

                clearDataLoaderCache([original, latestPage]);

                return {
                    ...result,
                    content: await decompressContent(result)
                };
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

        async getPage(id, options): Promise<any> {
            await pagesPermissions.ensure({ rwd: "r" });

            let page: Page | null = null;

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

            await pagesPermissions.ensure({ owns: page.ownedBy });

            if (options && options.decompress === false) {
                return page;
            }

            return {
                ...page,
                content: await decompressContent(page)
            };
        },

        async getPublishedPageById(this: PageBuilderContextObject, params): Promise<any> {
            const { id, preview } = params;

            let page: Page | null = null;

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

            return {
                ...page,
                content: await decompressContent(page)
            };
        },

        async getPublishedPageByPath(this: PageBuilderContextObject, params): Promise<any> {
            if (!params.path) {
                throw new WebinyError(
                    'Cannot get published page - "path" not provided.',
                    "GET_PUBLISHED_PATH_ERROR"
                );
            }

            const normalizedPath = normalizePath(params.path) as string;
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

            let page: Page | null = null;

            try {
                page = await storageOperations.pages.get({
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
                throw new NotFoundError("Page not found.");
            }
            return {
                ...page,
                content: await decompressContent(page)
            };
        },

        async listLatestPages(params, options = {}) {
            const { auth } = options;
            if (auth !== false) {
                await pagesPermissions.ensure({ rwd: "r" });
            }

            const {
                after = null,
                limit = 10,
                sort,
                search,
                exclude,
                where: initialWhere = {}
            } = params;

            let createdBy: string | undefined = undefined;
            if (await pagesPermissions.canAccessOnlyOwnRecords()) {
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
                const { items, meta } = await storageOperations.pages.list(listParams);

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
            const {
                after = null,
                limit = 10,
                sort,
                search,
                exclude,
                where: initialWhere = {}
            } = params;

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
                const { items, meta } = await storageOperations.pages.list(listParams);

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
            const { id: pid } = parseIdentifier(pageId);

            try {
                const pages = await storageOperations.pages.listRevisions({
                    where: {
                        pid,
                        tenant: getTenantId(),
                        locale: getLocaleCode()
                    },
                    sort: ["version_DESC"],
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
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    search
                }
            };

            try {
                return await storageOperations.pages.listTags(listTagsParams);
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
                return context.pageBuilder.getPrerenderingHandlers().flush(args);
            },
            render: async (args: RenderParams) => {
                return context.pageBuilder.getPrerenderingHandlers().render(args);
            }
        }
    };
};
