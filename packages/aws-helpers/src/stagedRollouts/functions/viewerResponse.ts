import { defineCloudfrontFunctionResponseHandler, setResponseCookie } from "~/cloudfrontFunctions";

import { variantRandomKey, configPath } from "../utils/common";

defineCloudfrontFunctionResponseHandler(event => {
    const request = event.request;
    const response = event.response;

    if (request.uri === configPath) {
        // requesting the config file, pass it through
        return response;
    }

    const variantRandom = request.headers[variantRandomKey]?.value;
    if (variantRandom) {
        setResponseCookie(response, {
            name: variantRandomKey,
            value: variantRandom
        });
    }

    return response;
});
