import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";
import { EventPlugin } from "~/plugins/EventPlugin";

export interface FastifyHandlerCallable<R> {
    (payload?: Record<string, any>): Promise<R>;
}

export interface CreateFastifyHandlerParams extends BaseCreateFastifyHandlerParams {
    debug?: boolean;
}

export const createFastifyHandler = <R extends Record<string, any> = Record<string, any>>(
    params: CreateFastifyHandlerParams
): FastifyHandlerCallable<R> => {
    return payload => {
        const app = createFastify({
            plugins: params.plugins,
            options: {
                logger: params?.debug === true,
                ...(params?.options || {})
            }
        });
        /**
         * There must be an event plugin for this handler to work.
         */
        const plugins = app.webiny.plugins.byType<EventPlugin>(EventPlugin.type);
        const hasEventPlugin = plugins.length > 0;
        if (!hasEventPlugin) {
            throw new Error(`@webiny/handler-fastify must have EventPlugin set.`);
        }
        return new Promise((resolve, reject) => {
            app.inject(
                {
                    method: "POST",
                    url: "/webiny-event",
                    payload: payload || {},
                    query: {},
                    headers: {}
                },
                err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    /**
                     * In our EventPlugin we stored result into custom property on the fastify instance.
                     */
                    const result = (app as any).__webiny_event_result;
                    resolve(result);
                }
            );
        });
    };
};
