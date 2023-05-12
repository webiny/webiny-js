import { ContextPlugin } from "@webiny/handler";
import { PbContext } from "~/graphql/types";

export default () => {
    return new ContextPlugin<PbContext>(async ({ pageBuilder }) => {
        /**
         * After a block has changed, rerender published pages.
         */
        pageBuilder.onPageBlockAfterUpdate.subscribe(async ({ pageBlock }) => {
            await pageBuilder.prerendering.render({
                tags: [{ tag: { key: "pb-page-block", value: pageBlock.id } }]
            });
        });
    });
};
