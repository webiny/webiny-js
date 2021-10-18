import { PagePlugin } from "~/plugins/PagePlugin";
import lodashGet from "lodash/get";

const NOT_FOUND_FOLDER = "_NOT_FOUND_PAGE_";

export default () => [
    new PagePlugin({
        // After a page was published, we need to render the page.
        async afterPublish({ context, page, publishedPage }) {
            const promises = [];
            promises.push(
                context.pageBuilder.pages.prerendering.render({
                    context,
                    paths: [{ path: page.path }]
                })
            );

            const settings = await context.pageBuilder.settings.getCurrent();

            const homePage = lodashGet(settings, "pages.home");
            // If we just published a page that is set as current homepage, let's rerender the "/" path as well.
            if (homePage === page.pid) {
                promises.push(
                    context.pageBuilder.pages.prerendering.render({
                        context,
                        paths: [{ path: "/" }]
                    })
                );
            }

            const notFoundPage = lodashGet(settings, "pages.notFound");
            // Finally, if we just published a page that is set as current not-found page, let's do
            // another rerender and save that into the NOT_FOUND_FOLDER.
            if (notFoundPage === page.pid) {
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
