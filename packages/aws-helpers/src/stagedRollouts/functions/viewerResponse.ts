import { defineCloudfrontFunctionResponseHandler, setResponseCookie } from "~/cloudfrontFunctions";

import { variantRandomKey } from "../utils/common";

defineCloudfrontFunctionResponseHandler(event => {
    const request = event.request;
    const response = event.response;

    const variantRandom = request.headers[variantRandomKey]?.value;
    if (variantRandom) {
        setResponseCookie(response, {
            name: variantRandomKey,
            value: variantRandom
        });
    }

    return response;
});
