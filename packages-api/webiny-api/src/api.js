// @flow
import _ from "lodash";
import debug from "debug";
import compose from "webiny-compose";
import semver from "semver";
import { App, ApiResponse, Endpoint, Entity } from "./index";
import { ServiceManager } from "webiny-service-manager";
import ApiErrorResponse from "./response/apiErrorResponse";

// Attributes registration functions
import registerBufferAttribute from "./attributes/registerBufferAttribute";
import registerFileAttributes from "./attributes/registerFileAttributes";
import registerImageAttributes from "./attributes/registerImageAttributes";

type EndpointsMap = {
    [url: string]: {
        classId: string,
        versions: { [version: string]: Class<Endpoint> },
        latest: string
    }
};

class Api {
    config: Object;
    apps: Array<App>;
    endpoints: EndpointsMap;
    requestMiddleware: Function;
    serviceManager: ServiceManager;
    namespace: cls$Namespace;

    constructor() {
        this.config = {};
        this.apps = [];
        this.endpoints = {};
        this.requestMiddleware = () => Promise.resolve();
        this.serviceManager = new ServiceManager();
    }

    getApps(): Array<App> {
        return this.apps;
    }

    getRequest(): express$Request {
        return this.namespace.get("req");
    }

    setConfig(config: Object) {
        this.config = config;
    }

    init(namespace: cls$Namespace): void {
        this.namespace = namespace;
        // Prepare apps
        this.apps = this.config.apps;
        this.endpoints = prepareEndpoints.call(this);

        if (typeof this.config.versioning !== "function") {
            this.config.versioning = () => "latest";
        }

        this.requestMiddleware = compose(this.config.use);

        // Configure Entity layer
        if (this.config.entity) {
            // Register Entity driver
            Entity.driver = this.config.entity.driver;
            // Register attributes
            this.config.entity.attributes &&
                this.config.entity.attributes({
                    bufferAttribute: registerBufferAttribute,
                    fileAttributes: registerFileAttributes,
                    imageAttributes: registerImageAttributes
                });
        }
    }

    /**
     * Handle request using middleware functions.
     * Response can be returned in 2 ways:
     * 1. set a `response` property of middleware `params` -> this will allow all functions to process the req/res.
     * 2. call `finish` from your middleware function -> this will return the result immediately and abort the middleware chain.
     * @param {express$Request} req
     * @param {express$Response} res
     * @returns {Promise<ApiResponse | typeof undefined>}
     */
    handleRequest(
        req: express$Request,
        res: express$Response
    ): Promise<ApiResponse | typeof undefined> {
        const params = { req, res, versioning: this.config.versioning, response: undefined };
        return this.requestMiddleware(params).then(result => {
            // If result was returned using `finish` callback return the returned result.
            // If not - return the result stored in the params.
            const apiResponse = typeof result !== "undefined" ? result : params.response;

            if (typeof apiResponse !== "undefined" && !(apiResponse instanceof ApiResponse)) {
                return new ApiErrorResponse(
                    {},
                    "Response must be an instance of ApiResponse",
                    "WBY_INVALID_RESPONSE",
                    500
                );
            }

            return apiResponse;
        });
    }
}

/**
 * Get latest version.
 * @param {Array<string>} versions
 * @returns {string | undefined}
 */
function getLatestVersion(versions: Array<string>) {
    return versions.sort(semver.compare).pop();
}

/**
 * Traverse registered apps and construct endpoints map.
 * @returns {EndpointsMap}
 */
function prepareEndpoints(): EndpointsMap {
    const log = debug("api:endpoints");
    const endpoints = {};
    const urlPattern = this.config.urlPattern || "/{app}/{endpoint}";

    this.apps.map((app: App) => {
        app.endpoints.map((endpoint: Class<Endpoint>) => {
            const name = endpoint.prototype.constructor.name;
            const url = urlPattern
                .replace("{app}", _.kebabCase(app.name))
                .replace("{endpoint}", _.kebabCase(name));

            const definition = endpoints[url] || {
                classId: endpoint.classId,
                versions: {},
                latest: ""
            };

            definition.versions[endpoint.version] = endpoint;
            definition.latest = getLatestVersion(Object.keys(definition.versions));

            endpoints[url] = definition;
            log("Registered endpoint %o (%o)", url, "v" + endpoint.version);
        });
    });

    return endpoints;
}

export default Api;
