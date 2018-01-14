// @flow
import _ from 'lodash';
import debug from 'debug';
import App from './app';
import { Endpoint } from './../endpoint';

export default (apps: Array<App>, config: { urlPattern: string }): Array<{ url: string, class: Endpoint }> => {
    const endpoints = [];
    const urlPattern = config.urlPattern || '/{app}/{endpoint}';
    const log = debug('api:endpoints');

    apps.map((app: App) => {
        app.getEndpoints().map((endpoint: Endpoint) => {
            const name = endpoint.prototype.constructor.name;
            const url = urlPattern.replace('{app}', _.kebabCase(app.name)).replace('{endpoint}', _.kebabCase(name));
            log('Registered endpoint %o', url);
            endpoints.push({ url, class: endpoint });
        });
    });

    return endpoints;
};