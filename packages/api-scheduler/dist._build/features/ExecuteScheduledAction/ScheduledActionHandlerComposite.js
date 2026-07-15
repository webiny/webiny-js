import { ScheduledActionHandler } from "../../shared/abstractions.js";
class ScheduledActionHandlerCompositeImpl {
    constructor(handlers){
        this.handlers = handlers;
    }
    canHandle(namespace, actionType) {
        return this.handlers.some((handler)=>handler.canHandle(namespace, actionType));
    }
    async handle(action) {
        const handler = this.handlers.find((h)=>h.canHandle(action.namespace, action.actionType));
        if (!handler) return void console.log(`No handler found for namespace "${action.namespace}" and actionType "${action.actionType}"`);
        await handler.handle(action);
    }
}
const ScheduledActionHandlerComposite = ScheduledActionHandler.createComposite({
    implementation: ScheduledActionHandlerCompositeImpl,
    dependencies: [
        [
            ScheduledActionHandler,
            {
                multiple: true
            }
        ]
    ]
});
export { ScheduledActionHandlerComposite };

//# sourceMappingURL=ScheduledActionHandlerComposite.js.map