import { PbContext } from "~/graphql/types";
import { ContextPlugin } from "@webiny/api";

export default () => {
    return new ContextPlugin<PbContext>(async ({ pageBuilder }) => {
        pageBuilder.onPageAfterDelete.subscribe(async params => {
            const { page, publishedPage } = params;
            /**
             * Published pages have this record.
             */
            if (!publishedPage) {
                return;
            }

            if (page.version === 1) {
                return pageBuilder.prerendering.flush({
                    paths: [{ path: publishedPage.path }]
                });
            }

            /**
             * If the published version was deleted.
             */
            const isPublished = publishedPage.id === page.id;
            if (isPublished) {
                return pageBuilder.prerendering.flush({
                    paths: [{ path: publishedPage.path }]
                });
            }
            /**
             * Note: special pages (404 / home) cannot be deleted, that's why
             * there is no special handling in regards to that here.
             */
        });
    });
};
