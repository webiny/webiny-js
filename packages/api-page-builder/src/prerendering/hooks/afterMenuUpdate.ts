import { MenuPlugin } from "~/plugins/MenuPlugin";

export default () => [
    new MenuPlugin({
        // After a menu has changed, invalidate all pages that contain the updated menu.
        async afterUpdate({ context, menu }) {
            await context.pageBuilder.pages.prerendering.render({
                context,
                tags: [{ tag: { key: "pb-menu", value: menu.slug } }]
            });
        }
    })
];
