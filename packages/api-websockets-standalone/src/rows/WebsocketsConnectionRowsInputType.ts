import { InputType } from "@webiny/api-kernel-core";

import {
    WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER,
    WebsocketsConnectionRowsInputHandler,
    type IWebsocketsConnectionRowsEvent
} from "./abstractions.js";

/** Recognizes the connection-rows event and routes it to `WebsocketsConnectionRowsInputHandler`. */
class WebsocketsConnectionRowsInputTypeImpl implements InputType.Interface<IWebsocketsConnectionRowsEvent> {
    matches(input: any): input is IWebsocketsConnectionRowsEvent {
        return input?.[WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER] === true;
    }

    getHandlerAbstraction() {
        return WebsocketsConnectionRowsInputHandler;
    }
}

export const WebsocketsConnectionRowsInputType = InputType.createImplementation({
    implementation: WebsocketsConnectionRowsInputTypeImpl,
    dependencies: []
});
