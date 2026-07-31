import type { Container } from "@webiny/di";
import { mdbid } from "@webiny/utils";
import {
    EmptyTrashBinRoute,
    BulkActionsInternalToken
} from "@webiny/api-headless-cms-bulk-actions-server";

const BULK_ACTIONS_HEADER = "x-webiny-bulk-actions-token";
const serverBase = () => `http://localhost:${process.env.PORT || "3002"}`;

// Default: trigger every 6 hours (in milliseconds).
const EMPTY_TRASH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function registerBulkActionsServer(rootContainer: Container): void {
    const token = mdbid();
    rootContainer.registerInstance(BulkActionsInternalToken, { value: token });
    rootContainer.register(EmptyTrashBinRoute);
}

export function startBulkActionsServer(rootContainer: Container): void {
    const token = rootContainer.resolve(BulkActionsInternalToken).value;

    const trigger = async () => {
        try {
            const res = await fetch(`${serverBase()}/empty-trash-bins`, {
                method: "POST",
                headers: { "content-type": "application/json", [BULK_ACTIONS_HEADER]: token },
                body: JSON.stringify({})
            });
            if (!res.ok) {
                const body = await res.text().catch(() => "");
                console.error(
                    `[bulk-actions] empty-trash-bins returned HTTP ${res.status}: ${body}`
                );
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[bulk-actions] failed to reach empty-trash-bins route: ${message}`);
        }
    };

    // Deferred initial trigger + periodic interval.
    setTimeout(trigger, 5000);
    setInterval(trigger, EMPTY_TRASH_INTERVAL_MS);
}
