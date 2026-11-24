import { InputType } from "~/features/events/InputType.js";
import type { IInputType } from "~/features/events/InputType.js";
import { TestHttpInputHandler } from "./TestHttpInputHandler.js";
import type { IHttpRequest } from "~/features/http/index.js";

export function isHttpRequest(event: any): event is IHttpRequest {
    return (
        typeof event === "object" &&
        event !== null &&
        typeof event.method === "string" &&
        typeof event.path === "string" &&
        typeof event.headers === "object" &&
        typeof event.query === "object"
    );
}

/**
 * InputType that recognizes IHttpRequest directly — no transport translation needed.
 * Use in tests to feed IHttpRequest straight into the chain, bypassing AWS/Node adapters.
 */
class TestHttpInputTypeImplementation implements IInputType<IHttpRequest> {
    matches(input: any): input is IHttpRequest {
        return isHttpRequest(input);
    }

    getHandlerAbstraction() {
        return TestHttpInputHandler;
    }
}
export const TestHttpInputType = InputType.createImplementation({
    implementation: TestHttpInputTypeImplementation,
    dependencies: []
});
