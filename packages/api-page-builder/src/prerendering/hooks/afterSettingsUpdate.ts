import { SettingsPlugin } from "~/plugins/SettingsPlugin";

const NOT_FOUND_FOLDER = "_NOT_FOUND_PAGE_";

export default () => [
    new SettingsPlugin({
        // After settings were changed, invalidate all pages that contain pb-page tag.
        async afterUpdate({ context, nextSettings, meta }) {
            if (!nextSettings) {
                return;
            }

            // TODO: optimize this.
            // TODO: right now, on each update of settings, we trigger a complete site rebuild.
            await context.pageBuilder.pages.prerendering.render({
                context,
                tags: [{ tag: { key: "pb-page" } }]
            });

            // If a change on pages settings (home, notFound) has been made, let's rerender accordingly.
            for (let i = 0; i < meta.diff.pages.length; i++) {
                const [type, , , page] = meta.diff.pages[i];
                switch (type) {
                    case "home":
                        await context.pageBuilder.pages.prerendering.render({
                            context,
                            paths: [{ path: "/" }]
                        });
                        break;
                    case "notFound":
                        await context.pageBuilder.pages.prerendering.render({
                            context,
                            paths: [
                                {
                                    path: page.path,
                                    configuration: {
                                        storage: { folder: NOT_FOUND_FOLDER }
                                    }
                                }
                            ]
                        });
                        break;
                }
            }
        }
    })
];
