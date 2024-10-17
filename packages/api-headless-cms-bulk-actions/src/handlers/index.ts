import { createEventBridgeHandler } from "./eventBridgeEventHandler";
import { setupEventsTenant } from "./setupEventsTenant";

export const createHandlers = () => {
    return [setupEventsTenant(), createEventBridgeHandler()];
};
