// @flow
import { EntityPool } from "webiny-entity";
import { app } from "./..";

class RequestEntityPool extends EntityPool {
    getPool() {
        const request = app.getRequest();
        if (!request) {
            throw Error(
                "Cannot continue - current request object wasn't received from app object."
            );
        }

        if (!request.entityPool) {
            request.entityPool = {};
        }

        return request.entityPool;
    }

    flush(): this {
        const request = app.getRequest();
        if (!request) {
            return this;
        }

        request.entityPool && delete request.entityPool;
        return this;
    }
}

export default RequestEntityPool;
