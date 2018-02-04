// @flow
import _ from "lodash";
import debug from "debug";
import { createNamespace } from "cls-hooked";
import { api } from "./index";
import responseProxy from "./response/responseProxy";
import type Api from "./api";

import type { express$Request, express$Response } from "../flow-typed/npm/express_v4.x.x";

let appInstance: Api;

function initApp(config: Object) {
    api.setConfig(config);
    api.init();
    appInstance = api;
}

// TODO: create Flow object for config
export default (config: Object) => {
    const log = debug("api:middleware");
    initApp(config);
    const namespace = createNamespace("webiny-api");

    // Route request
    return async (req: express$Request, res: express$Response, next: Function) => {
        log("Received new API request");
        namespace.run(async () => {
            return (async () => {
                res = responseProxy(res);
                namespace.set("req", req);
                await appInstance.handleRequest(req, res);

                if (res.finished) {
                    log("Request was finished before reaching the end of the cycle!");
                    return;
                }

                const responseData = res.getData();
                if (!_.isEmpty(responseData)) {
                    log("Finished processing request");
                    return res.json(responseData);
                }

                next();
            })();
        });
    };
};
