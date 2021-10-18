import { PagePlugin } from "~/plugins/PagePlugin";

export default () => [
    new PagePlugin({
        // After a page was unpublished, we need to flush the page.
        async afterUnpublish({ context, page }) {
            const promises = [];
            promises.push(
                context.pageBuilder.pages.prerendering.flush({
                    context,
                    paths: [{ path: page.path }]
                })
            );

            // Note: special pages (404 / home) cannot be unpublished, that's why
            // there is no special handling in regards to that here.
            await Promise.all(promises);
        }
    })
];
