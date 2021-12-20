import { PbContext } from "~/graphql/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

export default () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onAfterPageDelete.subscribe(async params => {
            const { page, publishedPage } = params;
            /**
             * Published pages have this record.
             */
            if (!publishedPage) {
                return;
            }

            if (page.version === 1) {
                return context.pageBuilder.prerendering.flush({
                    context,
                    paths: [{ path: publishedPage.path }]
                });
            }

            /**
             * If the published version was deleted.
             */
            const isPublished = publishedPage.id === page.id;
            if (isPublished) {
                return context.pageBuilder.prerendering.flush({
                    context,
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
