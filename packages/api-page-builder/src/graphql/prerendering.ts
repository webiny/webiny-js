import { MenuHookPlugin, PageHookPlugin, SettingsHookPlugin } from "@webiny/api-page-builder/types";

const NOT_FOUND_FOLDER = "_NOT_FOUND_PAGE_";
const ERROR_FOLDER = "_ERROR_PAGE_";

export default [
    {
        // After a page was unpublished, we need to flush the page.
        type: "pb-page-hook",
        async afterUnpublish(context, page) {
            const promises = [];
            promises.push(
                context.pageBuilder.pages.prerendering.flush({ paths: [{ path: page.path }] })
            );

            // After a page was unpublished, we need to rerender pages that contain pages list element.
            promises.push(
                context.pageBuilder.pages.prerendering.render({
                    tags: [{ class: "pb-pages-list" }]
                })
            );

            await Promise.all(promises);
        }
    } as PageHookPlugin,
    {
        // After we deleted a page, we need to clear prerender files / cache as well, if the page was published.
        type: "pb-page-hook",
        async afterDelete(context, { page, publishedPageData }) {
            // Published pages have this record.
            if (!publishedPageData) {
                return;
            }

            if (page.version === 1) {
                return context.pageBuilder.pages.prerendering.flush({
                    paths: [{ path: publishedPageData.path }]
                });
            }

            // If the published version was deleted.
            const isPublished = publishedPageData.id === page.id;
            if (isPublished) {
                return context.pageBuilder.pages.prerendering.flush({
                    paths: [{ path: publishedPageData.path }]
                });
            }
        }
    } as PageHookPlugin,
    {
        // After a page was published, we need to render the page.
        type: "pb-page-hook",
        async afterPublish(context, { page, publishedPageData }) {
            const promises = [];
            promises.push(
                context.pageBuilder.pages.prerendering.render({ paths: [{ path: page.path }] })
            );

            const settings = await context.pageBuilder.settings.default.get();

            // If we just published a page that is set as current homepage, let's rerender the "/" path as well.
            if (settings?.pages?.home === page.pid) {
                promises.push(
                    context.pageBuilder.pages.prerendering.render({ paths: [{ path: "/" }] })
                );
            }

            // If we just published a page that is set as current error page, let's do another
            // rerender and save that into the ERROR_FOLDER.
            if (settings?.pages?.error === page.pid) {
                promises.push(
                    context.pageBuilder.pages.prerendering.render({
                        paths: [
                            {
                                path: page.path,
                                configuration: {
                                    storage: { folder: ERROR_FOLDER }
                                }
                            }
                        ]
                    })
                );
            }

            // Finally, if we just published a page that is set as current not-found page, let's do
            // another rerender and save that into the NOT_FOUND_FOLDER.
            if (settings?.pages?.notFound === page.pid) {
                promises.push(
                    context.pageBuilder.pages.prerendering.render({
                        paths: [
                            {
                                path: page.path,
                                configuration: {
                                    storage: { folder: NOT_FOUND_FOLDER }
                                }
                            }
                        ]
                    })
                );
            }

            // After a page was published, we need to rerender pages that contain pages list element.
            promises.push(
                context.pageBuilder.pages.prerendering.render({
                    tags: [{ class: "pb-pages-list" }]
                })
            );

            // If we had a published page and the URL on which it was published is different than
            // the URL of the just published page, then let's flush the page on old URL.
            if (publishedPageData && publishedPageData.path !== page.path) {
                promises.push(
                    context.pageBuilder.pages.prerendering.flush({
                        paths: [{ path: publishedPageData.path }]
                    })
                );
            }

            await Promise.all(promises);
        }
    } as PageHookPlugin,
    {
        // After settings were changed, invalidate all pages that contain pb-page tag.
        type: "pb-settings-hook",
        async afterUpdate(context, previous, next, meta) {
            if (!next) {
                return;
            }

            // TODO: optimize this.
            // TODO: right now, on each update of settings, we trigger a complete site rebuild.
            await context.pageBuilder.pages.prerendering.render({ tags: [{ class: "pb-page" }] });

            // If a change on pages settings (home, error, notFound) has been made, let's rerender accordingly.
            for (let i = 0; i < meta.diff.pages.length; i++) {
                const [type, , , page] = meta.diff.pages[i];
                switch (type) {
                    case "home":
                        await context.pageBuilder.pages.prerendering.render({
                            paths: [{ path: "/" }]
                        });
                        break;
                    case "error":
                        await context.pageBuilder.pages.prerendering.render({
                            paths: [
                                {
                                    path: page.path,
                                    configuration: {
                                        storage: { folder: ERROR_FOLDER }
                                    }
                                }
                            ]
                        });
                        break;
                    case "notFound":
                        await context.pageBuilder.pages.prerendering.render({
                            paths: [
                                {
                                    path: page.path,
                                    configuration: {
                                        storage: { folder: NOT_FOUND_FOLDER }
                                    }
                                }
                            ]
                        });
                        break;
                }
            }
        }
    } as SettingsHookPlugin,
    {
        // After a menu has changed, invalidate all pages that contains the updated menu.
        type: "pb-menu-hook",
        async afterUpdate(context, menu) {
            await context.pageBuilder.pages.prerendering.render({
                tags: [{ class: "pb-menu", id: menu.slug }]
            });
        }
    } as MenuHookPlugin
];
