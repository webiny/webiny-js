import { parseJson } from "@webiny/utils/parseJson.js";
import { HttpClientError } from "./HttpClientError.js";

const FORBIDDEN_PROPERTY_MESSAGE = "Object contains forbidden";

/**
 * Parses a JSON request body with `parseJson`, which refuses `__proto__` and
 * `constructor.prototype` keys.
 *
 * Malformed JSON keeps the body as the raw string, so the route decides what to do with it. A body
 * carrying a prototype-pollution key is refused outright with a 400.
 */
export function parseJsonRequestBody(text: string): unknown {
    try {
        return parseJson(text);
    } catch (ex) {
        const message = ex instanceof Error ? ex.message : "";
        if (message.startsWith(FORBIDDEN_PROPERTY_MESSAGE)) {
            throw new HttpClientError(
                400,
                "REQUEST_BODY_INVALID",
                "The request body contains a forbidden property."
            );
        }
        return text;
    }
}
