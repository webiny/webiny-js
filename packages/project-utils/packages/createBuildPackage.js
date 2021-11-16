const buildPackage = require("./buildPackage");
const { prepareOptions } = require("../utils");

module.exports = config => async options => {
    const preparedOptions = prepareOptions({ config, options });
    return buildPackage(preparedOptions);
};
