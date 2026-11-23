import { WebsocketsValidationError } from "~/features/shared/errors.js";
import type { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";

/**
 * Security: an empty `identityId` / `connections` is falsy in the list use case and would fall
 * through to "list all", turning a targeted disconnect into disconnect-all.
 * Only a call without `where` may disconnect everything.
 */
export const validateDisconnectWhere = (
    where: WebsocketsListConnectionsUseCase.ParamsWhere | undefined
): WebsocketsValidationError | null => {
    if (!where) {
        return null;
    }
    const { identityId, connections } = where;
    if (identityId === undefined && connections === undefined) {
        return new WebsocketsValidationError("Disconnect filter must not be empty.");
    }
    if (identityId !== undefined && (typeof identityId !== "string" || !identityId.trim())) {
        return new WebsocketsValidationError("Identity ID must not be empty.");
    }
    if (
        connections !== undefined &&
        (!Array.isArray(connections) ||
            connections.length === 0 ||
            connections.some(id => typeof id !== "string" || !id.trim()))
    ) {
        return new WebsocketsValidationError("Connections must be a non-empty list of IDs.");
    }
    return null;
};
