import { createEventBridgeEventHandler } from "@webiny/handler-aws";
import { EntriesTask, HcmsBulkActionsContext } from "~/types";

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
                 * We loop through all tenants in the system and trigger the "EmptyTrashBins" task.
                 */
                const tenants = await context.tenancy.listTenants();
                await context.tenancy.withEachTenant(tenants, async () => {
                    await context.tasks.trigger({
                        definition: EntriesTask.EmptyTrashBins
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
