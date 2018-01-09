import _ from 'lodash';
import debug from 'debug';

export default (apps, config) => {
    const endpoints = [];
    const urlPattern = config.urlPattern || '/{app}/{endpoint}';
    const log = debug('api:endpoints');

    apps.map(app => {
        app.getEndpoints().map(endpoint => {
            const name = endpoint.prototype.constructor.name;
            const url = urlPattern.replace('{app}', _.kebabCase(app.name)).replace('{endpoint}', _.kebabCase(name));
            log('Registered endpoint %o', url);
            endpoints.push({ url, class: endpoint });
        });
    });

    return endpoints;
};