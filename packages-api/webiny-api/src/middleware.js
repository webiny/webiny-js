// @flow
import _ from "lodash";
import debug from "debug";
import api from "./index";
import cls from "cls-hooked";
import type Api from "./api";
import { ApiResponse } from "./index";

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
                namespace.set("req", req);
                const response = await appInstance.handleRequest(req, res);

                if (res.finished) {
                    log("Request was finished before reaching the end of the cycle!");
                    return;
                }

                if (!_.isEmpty(response)) {
                    log("Finished processing request");

                    if (response instanceof ApiResponse) {
                        response.send(res);
                    }
                }

                next();
            })();
        });
    };
};
