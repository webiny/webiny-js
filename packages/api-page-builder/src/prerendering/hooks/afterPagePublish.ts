import { PagePlugin } from "~/plugins/PagePlugin";
import lodashGet from "lodash/get";

const NOT_FOUND_FOLDER = "_NOT_FOUND_PAGE_";

export default () => [
    new PagePlugin({
        // After a page was published, we need to render the page.
        async afterPublish({ context, page, publishedPage }) {
            // First, let's load settings.
            const settings = await context.pageBuilder.settings.getCurrent();
            const notFoundPageId = lodashGet(settings, "pages.notFound");

            const promises = [];

            // Render regular page (not-found page has special treatment; see further below)
            if (page.pid !== notFoundPageId) {
                promises.push(
                    context.pageBuilder.pages.prerendering.render({
                        context,
                        paths: [{ path: page.path }]
                    })
                );
            }

            const homePageId = lodashGet(settings, "pages.home");
            // If we just published a page that is set as current homepage, let's rerender the "/" path as well.
            if (homePageId === page.pid) {
                promises.push(
                    context.pageBuilder.pages.prerendering.render({
                        context,
                        paths: [{ path: "/" }]
                    })
                );
            }

            // Finally, if we just published a page that is set as current not-found page, let's do
            // two versions of it: one goes in the system-level `_NOT_FOUND_PAGE_` folder, and another
            // one goes in the folder defined bu the page slug.
            if (notFoundPageId === page.pid) {
                promises.push(
                    context.pageBuilder.pages.prerendering.render({
                        context,
                        paths: [
                            {
                                path: page.path,
                                configuration: {
                                    meta: {
                                        notFoundPage: true
                                    },
                                    storage: { folder: NOT_FOUND_FOLDER }
                                }
                            },
                            {
                                path: page.path,
                                configuration: {
                                    meta: {
                                        notFoundPage: true
                                    }
                                }
                            }
                        ]
                    })
                );
            }

            // If we had a published page and the URL on which it was published is different than
            // the URL of the just published page, then let's flush the page on old URL.
            if (publishedPage && publishedPage.path !== page.path) {
                promises.push(
                    context.pageBuilder.pages.prerendering.flush({
                        context,
                        paths: [{ path: publishedPage.path }]
                    })
                );
            }

            await Promise.all(promises);
        }
    })
];
