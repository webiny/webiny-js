import { PagePlugin } from "~/plugins/PagePlugin";

export default () => [
    new PagePlugin({
        // After we deleted a page, we need to clear prerender files / cache as well, if the page was published.
        async afterDelete({ context, page, publishedPage }) {
            // Published pages have this record.
            if (!publishedPage) {
                return;
            }

            if (page.version === 1) {
                return context.pageBuilder.pages.prerendering.flush({
                    context,
                    paths: [{ path: publishedPage.path }]
                });
            }

            // If the published version was deleted.
            const isPublished = publishedPage.id === page.id;
            if (isPublished) {
                return context.pageBuilder.pages.prerendering.flush({
                    context,
                    paths: [{ path: publishedPage.path }]
                });
            }

            // Note: special pages (404 / home) cannot be deleted, that's why
            // there is no special handling in regards to that here.
        }
    })
];
