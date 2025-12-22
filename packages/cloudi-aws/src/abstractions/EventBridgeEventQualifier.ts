import { createAbstraction } from "./createAbstraction.js";

/**
 * Abstraction for EventBridge event qualifier
 */
export interface IEventBridgeEventQualifier {
    execute(event: any): boolean;
}

export const EventBridgeEventQualifier = createAbstraction<IEventBridgeEventQualifier>("EventBridgeEventQualifier");

export namespace EventBridgeEventQualifier {
    export type Interface = IEventBridgeEventQualifier;
}

