// @flow
import { EntityPool } from "webiny-entity";
import { api } from "./..";

class RequestEntityPool extends EntityPool {
    getPool() {
        const context = api.getContext();
        if (!context) {
            return this.pool;
        }

        if (!context.entityPool) {
            context.entityPool = {};
        }

        return context.entityPool;
    }

    flush(): this {
        const context = api.getContext();
        if (!context) {
            return this;
        }

        context.entityPool && delete context.entityPool;
        return this;
    }
}

export default RequestEntityPool;
