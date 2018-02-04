// @flow

/**
 * Compose a single middleware from the array of middleware functions
 *
 * @param {Array<Function>} functions functions
 * @return {Function}
 */
export default function(functions: Array<Function> = []): Function {
    return function(params: mixed): Promise<mixed> {
        return new Promise((resolve, reject) => {
            // Middleware chain
            let chain = Promise.resolve();
            for (let i = 0; i < functions.length; i++) {
                const middleware = functions[i];

                // Each function is a separate promise executed when the previous function called `next()`
                chain = chain.then(() => {
                    return new Promise((linkResolve, linkReject) => {
                        middleware(params, linkResolve, res => {
                            // Resolve top-level promise to return the result
                            resolve(res);
                            // Reject the chain
                            linkReject();
                        });
                    });
                });
            }

            chain.then(resolve).catch(error => {
                error && reject(error);
            });
        });
    };
}
