import type { Logger } from "~/features/logger/index.js";

/*
 * A Logger that drops every line, for test containers: the event handlers register the real one at
 * root, and api-core registers none. A test that checks what was logged uses a mock Logger instead.
 */
export class TestLogger implements Logger.Interface {
    public trace(): void {}

    public debug(): void {}

    public info(): void {}

    public warn(): void {}

    public error(): void {}

    public fatal(): void {}

    public log(): void {}
}
