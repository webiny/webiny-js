import { defineCloudfrontFunctionRequestHandler } from "~/cloudfrontFunctions";

import { variantFixedKey, variantRandomKey } from "../utils/common";
import { configPath } from "../utils/common";

defineCloudfrontFunctionRequestHandler(event => {
    const request = event.request;

    if (request.uri === configPath) {
        // requesting the config file, pass it through
        return request;
    }

    // Try to get stage name from cookie or header.
    const variantFixed =
        request.cookies?.[variantFixedKey]?.value || request.headers[variantFixedKey]?.value;
    if (variantFixed) {
        // If there is a fixed variant set, we just pass it further to origin request handler.
        request.headers[variantFixedKey] = {
            value: variantFixed
        };

        // If variant is explicitly selected, remove any random header a user may have passed.
        // We want to have either one or another for better cache hit rate.
        delete request.headers[variantRandomKey];
        return request;
    }

    // Otherwise we try to retrieve randomized number from user cookie.
    // This random value will be passed further to the origin request to select based on config.
    let variantRandom = Number(request.cookies?.[variantRandomKey]?.value);
    if (isNaN(variantRandom) || variantRandom < 1 || variantRandom > 100) {
        // If no value is present we simply randomize one.
        variantRandom = Math.floor(Math.random() * 100 + 1);
    }

    // TODO take interval from config
    // Adjust random value to a specific interval optimize caching.
    // Less possible values means less separate cache entries in CDN an better cache hit ratio.
    variantRandom -= variantRandom % 5;

    request.headers[variantRandomKey] = {
        value: variantRandom.toString()
    };

    return request;
});
