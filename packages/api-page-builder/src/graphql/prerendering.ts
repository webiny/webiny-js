import { PagePlugin } from "~/plugins/PagePlugin";
import { SettingsPlugin } from "~/plugins/SettingsPlugin";
import { MenuPlugin } from "~/plugins/MenuPlugin";

const NOT_FOUND_FOLDER = "_NOT_FOUND_PAGE_";

export default [
    new PagePlugin({
        // After a page was unpublished, we need to flush the page.
        async afterUnpublish({ context, page }) {
            const promises = [];
            promises.push(
                context.pageBuilder.pages.prerendering.flush({ paths: [{ path: page.path }] })
            );

            // After a page was unpublished, we need to rerender pages that contain pages list element.
            promises.push(
                context.pageBuilder.pages.prerendering.render({
                    tags: [{ tag: { key: "pb-pages-list" } }]
                })
            );

            // Note: special pages (404 / home) cannot be unpublished, that's why
            // there is no special handling in regards to that here.
            await Promise.all(promises);
        },
        // After we deleted a page, we need to clear prerender files / cache as well, if the page was published.
        async afterDelete({ context, page, publishedPage }) {
            // Published pages have this record.
            if (!publishedPage) {
                return;
            }

            if (page.version === 1) {
                return context.pageBuilder.pages.prerendering.flush({
                    paths: [{ path: publishedPage.path }]
                });
            }

            // If the published version was deleted.
            const isPublished = publishedPage.id === page.id;
            if (isPublished) {
                return context.pageBuilder.pages.prerendering.flush({
                    paths: [{ path: publishedPage.path }]
                });
            }

            // Note: special pages (404 / home) cannot be deleted, that's why
            // there is no special handling in regards to that here.
        },
        // After a page was published, we need to render the page.
        async afterPublish({ context, page, publishedPage }) {
            const promises = [];
            promises.push(
                context.pageBuilder.pages.prerendering.render({ paths: [{ path: page.path }] })
            );

            const settings = await context.pageBuilder.settings.getCurrent();

            // If we just published a page that is set as current homepage, let's rerender the "/" path as well.
            if (settings?.pages?.home === page.pid) {
                promises.push(
                    context.pageBuilder.pages.prerendering.render({ paths: [{ path: "/" }] })
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
                                    meta: {
                                        notFoundPage: true
                                    },
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
                    tags: [{ tag: { key: "pb-pages-list" } }]
                })
            );

            // If we had a published page and the URL on which it was published is different than
            // the URL of the just published page, then let's flush the page on old URL.
            if (publishedPage && publishedPage.path !== page.path) {
                promises.push(
                    context.pageBuilder.pages.prerendering.flush({
                        paths: [{ path: publishedPage.path }]
                    })
                );
            }

            await Promise.all(promises);
        }
    }),
    new SettingsPlugin({
        // After settings were changed, invalidate all pages that contain pb-page tag.
        async afterUpdate({ context, nextSettings, meta }) {
            if (!nextSettings) {
                return;
            }

            // TODO: optimize this.
            // TODO: right now, on each update of settings, we trigger a complete site rebuild.
            await context.pageBuilder.pages.prerendering.render({
                tags: [{ tag: { key: "pb-page" } }]
            });

            // If a change on pages settings (home, notFound) has been made, let's rerender accordingly.
            for (let i = 0; i < meta.diff.pages.length; i++) {
                const [type, , , page] = meta.diff.pages[i];
                switch (type) {
                    case "home":
                        await context.pageBuilder.pages.prerendering.render({
                            paths: [{ path: "/" }]
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
    }),
    new MenuPlugin({
        // After a menu has changed, invalidate all pages that contain the updated menu.
        async afterUpdate({ context, menu }) {
            await context.pageBuilder.pages.prerendering.render({
                tags: [{ tag: { key: "pb-menu", value: menu.slug } }]
            });
        }
    })
];
