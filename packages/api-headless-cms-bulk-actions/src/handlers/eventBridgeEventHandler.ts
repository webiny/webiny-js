import { createEventBridgeEventHandler } from "@webiny/handler-aws";
import { HcmsBulkActionsContext } from "~/types";

const DETAIL_TYPE = "WebinyEmptyTrashBin";

export const createEventBridgeHandler = () => {
    return createEventBridgeEventHandler<typeof DETAIL_TYPE, Record<string, any>>(
        async ({ context: ctx, payload }) => {
            try {
                /**
                 * If we receive an event that is not "WebinyEmptyTrashBin", we should exit.
                 */
                if (payload["detail-type"] !== DETAIL_TYPE) {
                    return;
                }

                const context = ctx as unknown as HcmsBulkActionsContext;

                if (!context.tasks || !context.tenancy) {
                    console.error("Missing tasks or tenancy definition on context.");
                    return;
                }

                /**
                 * Since the event is at the infrastructure level, it has no knowledge about tenancy.
                 * We trigger the `hcmsEntriesEmptyTrashBins` using root tenant.
                 */
                await context.tenancy.withRootTenant(async () => {
                    await context.tasks.trigger({
                        definition: "hcmsEntriesEmptyTrashBins"
                    });
                });

                return;
            } catch (ex) {
                console.error(
                    "[EVENT_BRIDGE_HANDLER_EMPTY_TRASH_BIN] => ",
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
