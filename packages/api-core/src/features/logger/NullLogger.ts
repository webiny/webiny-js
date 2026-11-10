import type { Logger } from "./abstractions.js";

/*
 * A Logger that drops every line. api-core registers no Logger, the event handlers register the real
 * one at root, so containers built without a handler, such as test harnesses, register this one.
 */
export class NullLogger implements Logger.Interface {
    public trace(): void {}

    public debug(): void {}

    public info(): void {}

    public warn(): void {}

    public error(): void {}

    public fatal(): void {}

    public log(): void {}
}
