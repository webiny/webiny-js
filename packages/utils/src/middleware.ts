export interface MiddlewareCallable {
    (...args: any[]): Promise<any>;
}

export interface MiddlewareResolve {
    (...args: any[]): void;
}

export interface MiddlewareReject {
    (error: Error): void;
}
/**
 * Compose a single middleware from the array of middleware functions
 */
export const middleware = <Params = any, Response = any>(functions: MiddlewareCallable[] = []) => {
    return (...args: Params[]): Promise<Response | undefined> => {
        if (!functions.length) {
            return Promise.resolve<Response | undefined>(undefined);
        }

        // Create a clone of function chain to prevent modifying the original array with `shift()`
        const chain = [...functions];
        return new Promise((parentResolve: MiddlewareResolve, parentReject: MiddlewareReject) => {
            const next = async (): Promise<any> => {
                const fn = chain.shift();
                if (!fn) {
                    return Promise.resolve();
                }

                return new Promise(async (resolve, reject) => {
                    try {
                        const result = await fn(...args, resolve);
                        if (typeof result !== "undefined") {
                            return parentResolve(result);
                        }
                    } catch (e) {
                        reject(e);
                    }
                })
                    .then(() => {
                        return next();
                    })
                    .then(() => {
                        parentResolve(...args);
                    })
                    .catch(e => {
                        parentReject(e);
                    });
            };

            return next();
        });
    };
};
