import { Context } from "@webiny/handler/types";
import { Plugin } from "@webiny/plugins/types";
import { RenderEvent, PrerenderingSettings, Render } from "~/types";

export type HandlerPayload = RenderEvent | RenderEvent[];

export type HookCallbackFunction = (args: {
    context: Context;
    log: (...args: string[]) => void;
    render: Omit<Render, "files">;
    settings: PrerenderingSettings;
}) => void | Promise<void>;

export interface RenderHookPlugin extends Plugin {
    type: "ps-render-hook";
    beforeRender?: HookCallbackFunction;
    afterRender?: HookCallbackFunction;
}

export interface RenderApolloState {
    [key: string]: string;
}
/**
 * @internal
 */
export interface RenderResult {
    content: string;
    meta: {
        apolloState: { main: RenderApolloState; cms: RenderApolloState };
        gqlCache: {
            [key: string]: any;
        };
        [key: string]: any;
    };
}
/**
 * @internal
 */
export interface RenderUrlCallableParams {
    context: Context;
    args: RenderEvent;
}
/**
 * @internal
 */
export interface RenderUrlParams extends RenderUrlCallableParams {
    renderUrlFunction?: (url: string, params: RenderUrlCallableParams) => Promise<RenderResult>;
}
/**
 * @internal
 */
export interface RenderUrlPostHtmlParams {
    render: RenderResult;
    args: RenderUrlParams;
    path: string;
    id: string;
    ts: number;
}
