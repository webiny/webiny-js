// @flow
import _ from "lodash";
import debug from "debug";
import { api } from "./index";
import cls from "cls-hooked";

import responseProxy from "./response/responseProxy";
import type Api from "./api";

let appInstance: Api;

function initApp(config: Object, namespace: cls$Namespace) {
    api.setConfig(config);
    api.init(namespace);
    appInstance = api;
}

// TODO: create Flow object for config
export default (config: Object) => {
    const log = debug("api:middleware");
    const namespace: cls$Namespace = cls.createNamespace(Date.now().toString());
    initApp(config, namespace);

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
