export interface MiddlewareCallable {
    (...args: any[]): Promise<any>;
}
/**
 * Compose a single middleware from the array of middleware functions
 */
export const middleware = (functions: MiddlewareCallable[] = []) => {
    return (...args: any[]): Promise<any> => {
        if (!functions.length) {
            return Promise.resolve();
        }

        // Create a clone of function chain to prevent modifying the original array with `shift()`
        const chain = [...functions];
        return new Promise((parentResolve: any, parentReject) => {
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
