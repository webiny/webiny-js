import debug from 'debug';
import _ from 'lodash';
import { app, ApiResponse } from './../index';

export default async ({ req, res }, next) => {
    const log = debug('api:endpoint');
    log(`Trying to match an endpoint: %o`, req.url);
    for (let i = 0; i < app.endpoints.length; i++) {
        const endpoint = app.endpoints[i];

        if (!req.url.startsWith(endpoint.url)) {
            continue;
        }

        const url = req.url.replace(endpoint.url, '') || '/';
        log(`Routing endpoint %o, with URL: %o`, endpoint.name, url);

        const instance = new endpoint.class();
        const matchedMethod = instance.getApi().matchMethod(req.method, url);
        if (!matchedMethod) {
            continue;
        }


        log('Matched %o', matchedMethod.getApiMethod().getPattern());
        const params = matchedMethod.getParams();
        const result = await matchedMethod.getApiMethod().exec(req, res, params, instance);
        const endpointData = result instanceof ApiResponse ? result.toJSON() : result;
        if (result instanceof ApiResponse) {
            res.status(result.getStatusCode());
        }
        res.setData(_.merge({}, res.getData(), endpointData));
        log(`Successfully fetched response!`);
    }
    next();
};