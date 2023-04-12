import {
    Context as BaseContext,
    ContextParams as BaseContextParams,
    ContextPlugin as BaseContextPlugin,
    ContextPluginCallable as BaseContextPluginCallable,
    createContextPlugin as baseCreateContextPlugin
} from "@webiny/api";
import { Context as ContextInterface } from "~/types";

export interface ContextParams extends BaseContextParams {
    server: ContextInterface["server"];
    routes: ContextInterface["routes"];
}

export class Context extends BaseContext implements ContextInterface {
    public readonly server: ContextInterface["server"];
    public readonly routes: ContextInterface["routes"];
    // @ts-ignore
    public handlerClient: ContextInterface["handlerClient"];
    // @ts-ignore
    public request: ContextInterface["request"];
    // @ts-ignore
    public reply: ContextInterface["reply"];

    public constructor(params: ContextParams) {
        super(params);
        this.server = params.server;
        this.routes = params.routes;
    }
}

/**
 * We need to extend and reexport the ContextPlugin, ContextPluginCallable and createContextPlugin to support extended context.
 *
 * This can be removed when we introduce the type augmentation.
 */
export type ContextPluginCallable<T extends ContextInterface = ContextInterface> = BaseContextPluginCallable<T>

export class ContextPlugin<
    T extends ContextInterface = ContextInterface
> extends BaseContextPlugin<T> {}

export const createContextPlugin = <T extends ContextInterface = ContextInterface>(
    callable: ContextPluginCallable<T>
) => {
    return baseCreateContextPlugin<T>(callable);
};
