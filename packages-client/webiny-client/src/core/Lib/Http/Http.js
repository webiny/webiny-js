import { Webiny } from "./../../../index";
import _ from "lodash";
import HttpRequest from "./Request";
import HttpResponse from "./Response";

const requestInterceptors = [];
const responseInterceptors = [];
const defaultHeaders = {};

let pending = [];
let timeout = null;

function execute(http, options, aggregate = true) {
    if (!timeout && aggregate) {
        timeout = setTimeout(() => {
            sendAggregatedRequest(); // eslint-disable-line
            timeout = null;
        }, _.get(Webiny.Config, "Api.AggregationInterval", 100));
    }
    const headers = _.merge({}, defaultHeaders, options.headers || {});
    http.setHeaders(headers);
    http.setResponseType(options.responseType || "json");

    if (options.downloadProgress) {
        http.setDownloadProgressHandler(options.downloadProgress);
    }

    if (options.progress) {
        http.setProgressHandler(options.progress);
    }

    let response;
    /* eslint-disable */
    for (let interceptor of requestInterceptors) {
        try {
            response = interceptor(http, options);
            if (response instanceof HttpResponse) {
                break;
            }
        } catch (e) {
            console.warn("Exception was thrown in one of the HTTP request interceptors!");
            console.error(e);
        }
    }
    /* eslint-enable */

    if (!response) {
        if (
            !aggregate ||
            !_.get(Webiny.Config, "Api.AggregateRequests", true) ||
            http.getMethod() !== "get"
        ) {
            response = http.send();
        } else {
            // If requests are being aggregated, push current http request into `pending` array for later resolving
            pending.push(http);
            // Return a new promise that will be resolved once the aggregated requests receive their responses
            response = new Promise(resolve => {
                // This is a little hack but gets the job done: set a resolver into the pending http request object
                http.__resolve = resolve;
            });

            if (pending.length >= _.get(Webiny.Config, "Api.MaxRequests", 30)) {
                clearTimeout(timeout);
                timeout = null;
                sendAggregatedRequest(); // eslint-disable-line
            }
        }
    } else {
        response = Promise.resolve(response);
    }

    return response.then(httpResponse => {
        try {
            responseInterceptors.forEach(interceptor => interceptor(httpResponse));
        } catch (e) {
            console.warn("Exception was thrown in one of the HTTP response interceptors!");
            console.error(e);
        }
        return httpResponse;
    });
}

function sendAggregatedRequest() {
    if (!pending.length) {
        return;
    }
    const inProgress = _.cloneDeep(pending);
    // Reset pending requests
    pending = [];
    pending.length = 0;

    const body = inProgress.map(req => {
        return {
            url: req.getUrl(),
            query: req.getQuery(),
            headers: req.getHeaders()
        };
    });
    const request = new HttpRequest();
    request.setUrl(Webiny.Config.Api.Url);
    request.setMethod("POST");
    request.setBody({ requests: body });
    execute(request, { headers: { "X-Webiny-Api-Aggregate": true } }, false).then(response => {
        response.getData("data").map((res, index) => {
            const aggRes = new HttpResponse(
                { data: res, status: res.statusCode },
                inProgress[index]
            );
            inProgress[index].__resolve(aggRes);
        });
    });
}

const Http = {
    Request: HttpRequest,
    Response: HttpResponse,

    /**
     * @options can contain {headers: {}, responseType: 'json'}
     */
    get(url, params = {}, options = {}) {
        const http = new HttpRequest();
        http
            .setUrl(url)
            .setMethod("get")
            .setQuery(params);
        return execute(http, options);
    },

    delete(url, options = {}) {
        const http = new HttpRequest();
        http.setUrl(url).setMethod("delete");
        return execute(http, options);
    },

    head(url, options = {}) {
        const http = new HttpRequest();
        http.setUrl(url).setMethod("head");
        return execute(http, options);
    },

    post(url, data = {}, params = {}, options = {}) {
        const http = new HttpRequest();
        http
            .setUrl(url)
            .setMethod("post")
            .setBody(data)
            .setQuery(params);
        return execute(http, options);
    },

    put(url, data = {}, params = {}, options = {}) {
        const http = new HttpRequest();
        http
            .setUrl(url)
            .setMethod("put")
            .setBody(data)
            .setQuery(params);
        return execute(http, options);
    },

    patch(url, data = {}, params = {}, options = {}) {
        const http = new HttpRequest();
        http
            .setUrl(url)
            .setMethod("patch")
            .setBody(data)
            .setQuery(params);
        return execute(http, options);
    },

    addRequestInterceptor(interceptor) {
        requestInterceptors.push(interceptor);
        return this;
    },

    addResponseInterceptor(interceptor) {
        responseInterceptors.push(interceptor);
        return this;
    }
};

export default Http;
