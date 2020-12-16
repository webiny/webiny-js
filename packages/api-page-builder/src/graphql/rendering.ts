import { MenuHookPlugin, PageHookPlugin, SettingsHookPlugin } from "@webiny/api-page-builder/types";

export default () => [
    {
        // After a page was published, we need to render the page.
        type: "pb-page-hook",
        async afterPublish({ context, page }) {
            const promises = [];
            promises.push(
                context.pageBuilder.pages.render({
                    url: page.url
                })
            );

            // If the page is set as site's homepage, we need to invalidate the "/" path too.
            if (page.home) {
                promises.push(context.pageBuilder.pages.render({ url: "/", queue: false }));
            }

            await Promise.all(promises);
        }
    } as PageHookPlugin,
    {
        // After a page was published, we need to rerender pages that contain pages list element.
        type: "pb-page-hook",
        async afterPublish({ context }) {
            await context.pageBuilder.pages.render({ tags: [{ class: "pb-pages-list" }] });
        }
    } as PageHookPlugin,
    {
        // After settings were changed, invalidate all pages that contain pb-page tag.
        type: "pb-settings-hook",
        async afterUpdate(context, settings) {
            // Avoid calling this callback while the Page Builder is installing and multiple save commands are issued.
            if (!settings.installed) {
                return;
            }

            await context.pageBuilder.pages.render({ tags: [{ class: "pb-page" }] });
        }
    } as SettingsHookPlugin,
    {
        // After a menu has changed, invalidate all pages that contains the updated menu.
        type: "pb-menu-hook",
        async afterUpdate(context, menu) {
            await context.pageBuilder.pages.render({ tags: [{ class: "pb-menu", id: menu.slug }] });
        }
    } as MenuHookPlugin
];
