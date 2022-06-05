import { PathItem, PbContext } from "~/graphql/types";
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
                const [type, prevPageId, , page] = meta.diff.pages[i];
                switch (type) {
                    case "home":
                        await context.pageBuilder.prerendering.render({
                            context,
                            paths: [{ path: "/" }]
                        });
                        break;
                    case "notFound":
                        const paths: PathItem[] = [
                            // Render the new "not found" page and store it into the NOT_FOUND_FOLDER.
                            {
                                path: page.path,
                                configuration: {
                                    meta: {
                                        notFoundPage: true
                                    },
                                    storage: { folder: NOT_FOUND_FOLDER }
                                }
                            }
                        ];

                        if (prevPageId) {
                            // Render the old "not found" page, to remove any notion of the "not found" concept
                            // from the snapshot, as well as the PS#RENDER record in the database.
                            const prevPage = await context.pageBuilder.getPublishedPageById({
                                id: prevPageId
                            });

                            paths.push({ path: prevPage.path });
                        }

                        await context.pageBuilder.prerendering.render({ context, paths });
                        break;
                }
            }
        });
    });
};
