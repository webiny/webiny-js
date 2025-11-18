import { IScheduledAction, ScheduledActionHandler } from "~/shared/abstractions.js";

/**
 * Composite handler that iterates through all registered handlers
 * to find one that can handle the given namespace + actionType combination.
 *
 * This is registered as a composite via container.registerComposite(),
 * and the DI container will automatically inject all registered handlers.
 */
class ScheduledActionHandlerCompositeImpl implements ScheduledActionHandler.Interface {
    constructor(private handlers: ScheduledActionHandler.Interface[]) {}

    canHandle(namespace: string, actionType: string): boolean {
        return this.handlers.some(handler => handler.canHandle(namespace, actionType));
    }

    async handle(action: IScheduledAction): Promise<void> {
        const handler = this.handlers.find(h => h.canHandle(action.namespace, action.actionType));

        if (!handler) {
            console.log(
                `No handler found for namespace "${action.namespace}" and actionType "${action.actionType}"`
            );
            return;
        }

        await handler.handle(action);
    }
}

export const ScheduledActionHandlerComposite = ScheduledActionHandler.createComposite({
    implementation: ScheduledActionHandlerCompositeImpl,
    dependencies: [[ScheduledActionHandler, { multiple: true }]]
});
