import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { PbContext } from "~/graphql/types";

export default () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.pages.onAfterPageUnpublish.subscribe(async ({ page }) => {
            const promises = [];
            promises.push(
                context.pageBuilder.pages.prerendering.flush({
                    context,
                    paths: [{ path: page.path }]
                })
            );
            /**
             * Note: special pages (404 / home) cannot be unpublished, that's why
             * there is no special handling in regards to that here.
             */
            await Promise.all(promises);
        });
    });
};
