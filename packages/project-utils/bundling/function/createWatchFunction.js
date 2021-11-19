const watchFunction = require("./watchFunction");
const { prepareOptions } = require("../../utils");

module.exports = config => async (options, context) => {
    const preparedOptions = prepareOptions({ config, options });
    return watchFunction(preparedOptions, context);
};
