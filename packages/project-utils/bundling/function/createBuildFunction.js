const buildFunction = require("./buildFunction");
const { prepareOptions } = require("../../utils");

module.exports = config => async options => {
    const preparedOptions = prepareOptions({ config, options });
    return buildFunction(preparedOptions);
};
