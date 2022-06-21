const buildHandler = require("./buildHandler");
const { prepareOptions } = require("../../utils");

module.exports = config => async options => {
    const preparedOptions = prepareOptions({ config, options });
    return buildHandler(preparedOptions);
};
