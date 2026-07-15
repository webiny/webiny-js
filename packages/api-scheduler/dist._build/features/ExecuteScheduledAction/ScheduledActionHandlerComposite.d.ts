import { IScheduledAction, ScheduledActionHandler, type ScheduledActionType } from "~/shared/abstractions.js";
import type { GenericRecord } from "@webiny/api/types.js";
/**
 * Composite handler that iterates through all registered handlers
 * to find one that can handle the given namespace + actionType combination.
 *
 * This is registered as a composite via container.registerComposite(),
 * and the DI container will automatically inject all registered handlers.
 */
declare class ScheduledActionHandlerCompositeImpl implements ScheduledActionHandler.Interface {
    private handlers;
    constructor(handlers: ScheduledActionHandler.Interface[]);
    canHandle(namespace: string, actionType: ScheduledActionType): boolean;
    handle<T extends GenericRecord>(action: IScheduledAction<T>): Promise<void>;
}
export declare const ScheduledActionHandlerComposite: typeof ScheduledActionHandlerCompositeImpl & {
    __abstraction: import("@webiny/di").Abstraction<import("~/shared/abstractions.js").IScheduledActionHandler>;
};
export {};
