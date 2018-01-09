import _ from 'lodash';
import debug from 'debug';
import { createNamespace } from 'cls-hooked';
import { app } from 'webiny-api/src';
import responseProxy from './response/responseProxy';

let appInstance = null;

function initApp(config) {
    app.setConfig(config);
    app.init();
    appInstance = app;
}

export default (config) => {
    const log = debug('api:middleware');
    initApp(config);
    const namespace = createNamespace('webiny-api');

    // Route request
    return async (req, res, next) => {
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