import { Plugin } from "@webiny/plugins/Plugin";
import { FastifyInstance } from "fastify";

interface ModifyFastifyPluginCallable {
    (app: FastifyInstance): void;
}

export class ModifyFastifyPlugin extends Plugin {
    public static override type = "handler.fastify.modify";

    private readonly cb: ModifyFastifyPluginCallable;

    public constructor(cb: ModifyFastifyPluginCallable) {
        super();
        this.cb = cb;
    }

    public modify(app: FastifyInstance): void {
        this.cb(app);
    }
}

export const createModifyFastifyPlugin = (cb: ModifyFastifyPluginCallable) => {
    return new ModifyFastifyPlugin(cb);
};
