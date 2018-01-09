import _ from 'lodash';
import debug from 'debug';
import { Auth } from './auth';
import { Entity } from './entity';
import { getNamespace } from 'cls-hooked';
import koaCompose from 'koa-compose';

class App {
    constructor(serviceManager) {
        this.config = {};
        this.apps = [];
        this.endpoints = [];
        this.requestMiddleware = _.noop;
        this.serviceManager = serviceManager;
    }

    getApps() {
        return this.apps;
    }

    getRequest() {
        return getNamespace('webiny-api').get('req');
    }

    setConfig(config) {
        this.config = config;
    }

    getAuth() {
        return this.serviceManager.get('Auth');
    }

    init() {
        // Prepare apps
        this.apps = this.config.apps;
        this.endpoints = prepareEndpoints.call(this);
        this.requestMiddleware = koaCompose(this.config.middlewares.request([]));

        this.serviceManager.add('Auth', () => new Auth(this.config.auth), true);
        if (this.config.entity) {
            Entity.driver = this.config.entity.driver;
        }
    }

    handleRequest(req, res) {
        return this.requestMiddleware({ req, res });
    }
}

/**
 * Traverse registered apps and construct endpoints map.
 */
function prepareEndpoints() {
    const log = debug('api:endpoints');
    const endpoints = [];
    const urlPattern = this.config.urlPattern || '/{app}/{endpoint}';

    this.apps.map(app => {
        app.endpoints.map(endpoint => {
            const name = endpoint.prototype.constructor.name;
            const url = urlPattern.replace('{app}', _.kebabCase(app.name)).replace('{endpoint}', _.kebabCase(name));
            //log('Registered endpoint %o', url);
            endpoints.push({ url, name, class: endpoint });
        });
    });

    return endpoints;
}

export default App;