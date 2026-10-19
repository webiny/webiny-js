import type { HandlerApp } from "@webiny/event-handler-core";
import type { EventDispatcher } from "@webiny/event-handler-core";

type RunInContext = <TResult>(fn: () => TResult) => TResult;

/**
 * Dispatches into the handler app in the async context captured at boot. Identity and
 * authorization overrides (`withIdentity`, `withoutAuthorization`) live in AsyncLocalStorage, so an
 * event dispatched from inside one of them would otherwise run its whole request under it.
 */
export class HandlerAppEventDispatcher implements EventDispatcher.Interface {
    public constructor(
        private readonly app: HandlerApp,
        private readonly runInBootContext: RunInContext
    ) {}

    public dispatch<TResult = unknown>(event: unknown): Promise<TResult> {
        return this.runInBootContext(() => this.app.handle(event));
    }
}
