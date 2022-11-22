import { ContextPlugin } from "@webiny/api";
import { PbContext } from "~/graphql/types";

export default () => {
    return new ContextPlugin<PbContext>(async ({ pageBuilder }) => {
        /**
         * After a menu has changed, invalidate all pages that contain the updated menu.
         */
        pageBuilder.onMenuAfterUpdate.subscribe(async ({ menu }) => {
            await pageBuilder.prerendering.render({
                tags: [{ tag: { key: "pb-menu", value: menu.slug } }]
            });
        });
    });
};
