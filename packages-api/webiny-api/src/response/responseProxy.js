/**
 * This function creates a thin wrapper around the original Response object 
 * to intercept method/property calls and provide a few additional methods.
 * 
 * @param {*} res 
 */
export default (res) => {
    let responseData = {};

    const interceptor = {
        getData() {
            return responseData;
        },
        setData(data) {
            responseData = data;
        }
    };

    return new Proxy(res, {
        get: (target, key) => {
            if (interceptor[key]) {
                return interceptor[key];
            }

            const origProperty = target[key];
            if (typeof origProperty === 'function') {
                return (...args) => origProperty.apply(target, args);
            }
            return origProperty;
        }
    });
};
