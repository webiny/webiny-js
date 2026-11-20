import type { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";

/** Removes a connection's row. One already gone (removed by another process) is not an error. */
export const unregisterConnection = async (
    registry: ConnectionRegistry.Interface,
    connectionId: string
): Promise<void> => {
    try {
        await registry.unregister({ connectionId });
    } catch (err) {
        if ((err as { code?: string }).code === "CONNECTION_NOT_FOUND") {
            return;
        }
        throw err;
    }
};
