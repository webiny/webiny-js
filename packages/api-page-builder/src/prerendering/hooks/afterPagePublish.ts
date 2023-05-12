import lodashGet from "lodash/get";
import { ContextPlugin } from "@webiny/api";
import { PbContext } from "~/graphql/types";

export default () => {
    return new ContextPlugin<PbContext>(async ({ pageBuilder }) => {
        /**
         * After a page was published, we need to render the page.
         */
        pageBuilder.onPageAfterPublish.subscribe(async params => {
            const { page, publishedPage } = params;
            /**
             * First, let's load settings.
             */
            const settings = await pageBuilder.getCurrentSettings();
            const notFoundPageId = lodashGet(settings, "pages.notFound");

            const promises = [];

            /**
             * Render regular page (not-found page has special treatment; see further below)
             */
            if (page.pid !== notFoundPageId) {
                promises.push(pageBuilder.prerendering.render({ paths: [{ path: page.path }] }));
            }

            const homePageId = lodashGet(settings, "pages.home");
            /**
             * If we just published a page that is set as current homepage, let's rerender the "/" path as well.
             */
            if (homePageId === page.pid) {
                promises.push(pageBuilder.prerendering.render({ paths: [{ path: "/" }] }));
            }
            /**
             * Finally, if we just published a page that is set as current not-found page, add a `notFoundPage` boolean.
             */
            if (notFoundPageId === page.pid) {
                promises.push(
                    pageBuilder.prerendering.render({
                        paths: [
                            {
                                path: page.path,
                                tags: [{ key: "notFoundPage", value: true }]
                            }
                        ]
                    })
                );
            }
            /**
             * If we had a published page and the URL on which it was published is different from
             * the URL of the page that was just published, then let's flush the page on old URL.
             */
            if (publishedPage && publishedPage.path !== page.path) {
                promises.push(
                    pageBuilder.prerendering.flush({ paths: [{ path: publishedPage.path }] })
                );
            }

            await Promise.all(promises);
        });
    });
};
