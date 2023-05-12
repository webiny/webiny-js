import { PathItem, PbContext } from "~/graphql/types";
import { ContextPlugin } from "@webiny/api";

export default () => {
    return new ContextPlugin<PbContext>(async ({ pageBuilder }) => {
        pageBuilder.onSettingsAfterUpdate.subscribe(async params => {
            const { settings, meta } = params;
            if (!settings) {
                return;
            }

            /**
             * If a change on pages settings (home, notFound) has been made, let's rerender accordingly.
             */
            const toRender: PathItem[] = [];

            for (let i = 0; i < meta.diff.pages.length; i++) {
                const [type, prevPageId, , page] = meta.diff.pages[i];
                switch (type) {
                    case "home":
                        toRender.push({ path: "/" });
                        break;
                    case "notFound":
                        // Render the new "not found" page and store it into the NOT_FOUND_FOLDER.
                        toRender.push({
                            path: page.path,
                            tags: [{ key: "notFoundPage", value: true }]
                        });

                        if (prevPageId) {
                            // Render the old "not found" page, to remove any notion of the "not found" concept
                            // from the snapshot, as well as the PS#RENDER record in the database.
                            const prevPage = await pageBuilder.getPublishedPageById({
                                id: prevPageId
                            });

                            toRender.push({ path: prevPage.path });
                        }

                        break;
                }
            }

            // Render homepage/not-found page
            if (toRender.length > 0) {
                await pageBuilder.prerendering.render({ paths: toRender });
            }

            /**
             * TODO: right now, on each update of settings, we trigger a complete site rebuild.
             * This is from ideal, and we need to implement better checks if full rerender is necessary.
             * Why full site rerender? Settings contain logo, favicon, site title, social stuff, and that's
             * used on all pages.
             */
            await pageBuilder.prerendering.render({
                // This flag is for backwards compatibility with the original custom queue implementation
                // using the "cron job" type of Lambda worker, executed periodically.
                queue: true,
                // We want to rerender everything, but exclude homepage/not-found page, if they were changed.
                paths: [{ path: "*", exclude: toRender.map(task => task.path) }]
            });
        });
    });
};
