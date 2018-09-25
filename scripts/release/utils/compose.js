/**
 * Compose a single middleware from the array of middleware functions
 *
 * @param {Array<Function>} functions functions
 * @return {Function}
 */
module.exports = function(functions = []) {
    return function(params) {
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
                        parentResolve();
                    })
                    .catch(e => {
                        parentReject(e);
                    });
            };

            return next();
        });
    };
};
