import { PbContext } from "~/graphql/types";
import { ContextPlugin } from "@webiny/handler";

const NOT_FOUND_FOLDER = "_NOT_FOUND_PAGE_";

export default () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onAfterSettingsUpdate.subscribe(async params => {
            const { settings, meta } = params;
            if (!settings) {
                return;
            }
            /**
             * TODO: optimize this.
             * TODO: right now, on each update of settings, we trigger a complete site rebuild.
             */
            await context.pageBuilder.prerendering.render({
                context,
                queue: true,
                paths: [{ path: "*" }]
            });

            /**
             * If a change on pages settings (home, notFound) has been made, let's rerender accordingly.
             */
            for (let i = 0; i < meta.diff.pages.length; i++) {
                const [type, , , page] = meta.diff.pages[i];
                switch (type) {
                    case "home":
                        await context.pageBuilder.prerendering.render({
                            context,
                            paths: [{ path: "/" }]
                        });
                        break;
                    case "notFound":
                        await context.pageBuilder.prerendering.render({
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
                        });
                        break;
                }
            }
        });
    });
};
