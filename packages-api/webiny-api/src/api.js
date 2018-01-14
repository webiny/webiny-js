// @flow
import _ from 'lodash';
import debug from 'debug';
import { getNamespace } from 'cls-hooked';
import koaCompose from 'koa-compose';
import { Auth } from './auth';
import { Entity } from './entity';
import { Endpoint } from './endpoint';
import App from './etc/app';
import Services from './etc/services';

class Api {
    config: Object;
    apps: Array<App>;
    endpoints: Array<Endpoint>;
    requestMiddleware: Function;
    serviceManager: Services;

    constructor(services: Services) {
        this.config = {};
        this.apps = [];
        this.endpoints = [];
        this.requestMiddleware = _.noop;
        this.serviceManager = services;
    }

    getApps(): Array<App> {
        return this.apps;
    }

    getRequest(): express$Request {
        return getNamespace('webiny-api').get('req');
    }

    setConfig(config: Object) {
        this.config = config;
    }

    getAuth(): IAuth {
        return this.serviceManager.get('Auth');
    }

    init(): void {
        // Prepare apps
        this.apps = this.config.apps;
        this.endpoints = prepareEndpoints.call(this);
        this.requestMiddleware = koaCompose(this.config.middlewares.request([]));

        // Register `Auth` service
        this.serviceManager.add('Auth', () => new Auth(this.config.auth), true);

        // Assign entity driver (if configured)
        if (this.config.entity) {
            Entity.driver = this.config.entity.driver;
        }
    }

    handleRequest(req: express$Request, res: express$Response): Promise<void> {
        return this.requestMiddleware({ req, res });
    }
}

/**
 * Traverse registered apps and construct endpoints map.
 */
function prepareEndpoints(): Array<Endpoint> {
    const log = debug('api:endpoints');
    const endpoints = [];
    const urlPattern = this.config.urlPattern || '/{app}/{endpoint}';

    this.apps.map((app: App) => {
        app.endpoints.map((endpoint: Endpoint) => {
            const name = endpoint.prototype.constructor.name;
            const url = urlPattern.replace('{app}', _.kebabCase(app.name)).replace('{endpoint}', _.kebabCase(name));
            log('Registered endpoint %o', url);
            endpoints.push({ url, name, class: endpoint });
        });
    });

    return endpoints;
}

export default Api;