// @flow
import _ from "lodash";
import debug from "debug";
import compose from "webiny-compose";
import semver from "semver";
import { Entity } from "./entity";
import { Endpoint } from "./endpoint";
import App from "./etc/app";
import type Services from "./etc/services";

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
    serviceManager: Services;
    namespace: cls$Namespace;

    constructor(services: Services) {
        this.config = {};
        this.apps = [];
        this.endpoints = {};
        this.requestMiddleware = () => Promise.resolve();
        this.serviceManager = services;
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

    init(namespace: Namespace): void {
        this.namespace = namespace;
        // Prepare apps
        this.apps = this.config.apps;
        this.endpoints = prepareEndpoints.call(this);

        if (typeof this.config.versioning !== "function") {
            this.config.versioning = () => "latest";
        }

        this.requestMiddleware = compose(this.config.use);

        // Assign entity driver (if configured)
        if (this.config.entity) {
            Entity.driver = this.config.entity.driver;
        }
    }

    handleRequest(req: express$Request, res: express$Response): Promise<void> {
        const params = { req, res, versioning: this.config.versioning };
        return this.requestMiddleware(params);
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
