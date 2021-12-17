import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { PbContext } from "~/graphql/types";

export default () => {
    return new ContextPlugin<PbContext>(async context => {
        /**
         * After a menu has changed, invalidate all pages that contain the updated menu.
         */
        context.pageBuilder.menus.onAfterMenuUpdate.subscribe(async ({ menu }) => {
            await context.pageBuilder.pages.prerendering.render({
                context,
                tags: [{ tag: { key: "pb-menu", value: menu.slug } }]
            });
        });
    });
};
