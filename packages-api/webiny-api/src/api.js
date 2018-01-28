// @flow
import _ from "lodash";
import debug from "debug";
import { getNamespace } from "cls-hooked";
import koaCompose from "koa-compose";
import semver from "semver";
import { Auth } from "./auth";
import { Entity } from "./entity";
import { Endpoint } from "./endpoint";
import App from "./etc/app";
import Services from "./etc/services";
import { EndpointMiddleware } from "./index";

const defaultRequestMiddleware = () => [EndpointMiddleware];

class Api {
    config: Object;
    apps: Array<App>;
    endpoints: EndpointsMap;
    requestMiddleware: Function;
    serviceManager: Services;

    constructor(services: Services) {
        this.config = {};
        this.apps = [];
        this.endpoints = {};
        this.requestMiddleware = _.noop;
        this.serviceManager = services;
    }

    getApps(): Array<App> {
        return this.apps;
    }

    getRequest(): express$Request {
        return getNamespace("webiny-api").get("req");
    }

    setConfig(config: Object) {
        this.config = config;
    }

    getAuth(): IAuth {
        return this.serviceManager.get("Auth");
    }

    init(): void {
        // Prepare apps
        this.apps = this.config.apps;
        this.endpoints = prepareEndpoints.call(this);

        if (typeof this.config.versioning !== "function") {
            this.config.versioning = () => "latest";
        }

        // Assign default request middleware
        if (!_.get(this.config, "middlewares.request")) {
            _.set(this.config, "middlewares.request", defaultRequestMiddleware);
        }

        this.requestMiddleware = koaCompose(this.config.middlewares.request([]));

        // Register `Auth` service
        this.serviceManager.add("Auth", () => new Auth(this.config.auth), true);

        // Assign entity driver (if configured)
        if (this.config.entity) {
            Entity.driver = this.config.entity.driver;
        }
    }

    handleRequest(req: express$Request, res: express$Response): Promise<void> {
        return this.requestMiddleware({ req, res, versioning: this.config.versioning });
    }
}

function getLatestVersion(versions: Array<string>) {
    return versions.sort(semver.compare).pop();
}

/**
 * Traverse registered apps and construct endpoints map.
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
            log("Registered endpoint %o (v%o)", url, endpoint.version);
        });
    });

    return endpoints;
}

export default Api;
