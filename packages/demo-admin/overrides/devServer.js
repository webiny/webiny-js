/**
 * Watch files matching given regex
 *
 * @param options.include RegExp
 * @returns {function(*): function(*=, *=): *}
 */
module.exports = (options = {}) => configFunction => {
    return function(proxy, allowedHost) {
        const config = configFunction(proxy, allowedHost);
        const originalRegex = config.watchOptions.ignored;

        const { include } = options;

        config.watchOptions = {
            ignored: string => {
                if (include && include.test(string)) {
                    return false;
                }

                return originalRegex.test(string);
            }
        };

        return config;
    };
};
