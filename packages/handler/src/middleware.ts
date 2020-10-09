/**
 * Compose a single middleware from the array of middleware functions
 */
export default (functions: Array<Function> = []): Function => {
    return (...args): Promise<any> => {
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
