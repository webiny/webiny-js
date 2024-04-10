import { createEventBridgeEventHandler } from "@webiny/handler-aws";
import { EntriesTask, HeadlessCmsTasksContext } from "~/types";

const DETAIL_TYPE = "WebinyEmptyTrashBin";

export const createEventHandler = () => {
    return createEventBridgeEventHandler<typeof DETAIL_TYPE, Record<string, any>>(
        async ({ context: ctx, payload }) => {
            try {
                if (payload["detail-type"] !== DETAIL_TYPE) {
                    return;
                }

                const context = ctx as unknown as HeadlessCmsTasksContext;

                if (!context.tasks) {
                    console.error("Missing tasks definition on context.");
                    return;
                }

                await context.tasks.trigger({
                    definition: EntriesTask.EmptyTrashBins
                });

                return;
            } catch (ex) {
                console.error(
                    "[HANDLER_EMPTY_TRASH_BIN] => ",
                    JSON.stringify({
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    })
                );
            }
        }
    );
};
