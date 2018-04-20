// @flow

/**
 * Compose a single middleware from the array of middleware functions
 *
 * @param {Array<Function>} functions functions
 * @return {Function}
 */
export default function(functions: Array<Function> = []): Function {
    return function(params: mixed): Promise<mixed> {
        if (!functions.length) {
            return Promise.resolve();
        }

        // Create a clone of function chain to prevent modifying the original array with `shift()`
        const chain = [...functions];
        return new Promise((parentResolve, parentReject) => {
            const next = async () => {
                const fn = chain.shift();
                if (!fn) {
                    return Promise.resolve();
                }
                return new Promise(async (resolve, reject) => {
                    try {
                        await fn(params, resolve, parentResolve);
                    } catch (e) {
                        reject(e);
                    }
                })
                    .then(() => {
                        return next();
                    })
                    .then(() => {
                        parentResolve(params);
                    })
                    .catch(e => {
                        parentReject(e);
                    });
            };

            return next();
        });
    };
}
