import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";

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
            plugins: params?.plugins || [],
            options: {
                logger: params?.debug === true,
                ...(params?.options || {})
            }
        });
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
