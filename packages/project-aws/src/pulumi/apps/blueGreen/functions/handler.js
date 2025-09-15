const cf = require("cloudfront");

const BLUE_GREEN_ROUTER_STORE_ID = "{BLUE_GREEN_ROUTER_STORE_ID}";
const BLUE_GREEN_ROUTER_STORE_KEY = "{BLUE_GREEN_ROUTER_STORE_KEY}";
const BLUE_GREEN_ROUTER_DOMAINS = "{BLUE_GREEN_ROUTER_DOMAINS}";

const store = cf.kvs(BLUE_GREEN_ROUTER_STORE_ID);

function removeProtocol(url) {
    return url.replace(/^https?:\/\//, "");
}
function requestWithError(request, error) {
    console.log(`There is an error: ${error.message}`);
    const properties = Object.getOwnPropertyNames(error);
    for (const property in properties) {
        console.log(`${property}: ${error[property]}`);
    }
    request.headers["x-webiny-debug-log"] = {
        value: error.message
    };

    return request;
}

function getTargetDomain(headers, active) {
    const values = headers.host;
    if (!values) {
        throw new Error("Missing the 'host' header.");
    }
    const initialHost = Array.isArray(values) ? values[0].value : values.value;
    if (!initialHost) {
        throw new Error("Missing the 'host' header value.");
    }
    const host = removeProtocol(initialHost);

    const domain = BLUE_GREEN_ROUTER_DOMAINS.find(
        domain => domain.name === active && domain.sourceDomain === host
    );
    if (domain) {
        return domain;
    }
    throw new Error(`Could not find a domain mapping for ${host}.`);
}

function handleRequest(request, active) {
    const targetDomain = getTargetDomain(request.headers || {}, active);

    cf.updateRequestOrigin({
        domainName: targetDomain.targetDomain
    });

    return request;
}

async function handler(event) {
    const context = event.context;
    const request = event.request;

    try {
        if (context.eventType !== "viewer-request") {
            new Error("This function only supports viewer-request events.");
        }
        const active = await store.get(BLUE_GREEN_ROUTER_STORE_KEY);
        if (!active) {
            throw new Error("Blue/Green system is not configured.");
        }

        return await handleRequest(request, active);
    } catch (ex) {
        return requestWithError(request, ex);
    }
}
