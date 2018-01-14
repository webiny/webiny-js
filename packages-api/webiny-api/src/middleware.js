// @flow
import _ from 'lodash';
import debug from 'debug';
import { createNamespace } from 'cls-hooked';
import Api from './api';
import { app } from '.';
import responseProxy from './response/responseProxy';

let appInstance: Api;

function initApp(config: Object) {
    app.setConfig(config);
    app.init();
    appInstance = app;
}

export default (config: Object) => {
    const log = debug('api:middleware');
    initApp(config);
    const namespace = createNamespace('webiny-api');

    // Route request
    return async (req: express$Request, res: express$Response, next: Function) => {
        log('Received new API request');
        namespace.run(async () => {
            return (async () => {
                res = responseProxy(res);
                namespace.set('req', req);
                await appInstance.handleRequest(req, res);

                if (res.finished) {
                    log('Request was finished before reaching the end of the cycle!');
                    return;
                }

                const responseData = res.getData();
                if (!_.isEmpty(responseData)) {
                    log('Finished processing request');
                    return res.json(responseData);
                }

                next();
            })();
        });
    };
};