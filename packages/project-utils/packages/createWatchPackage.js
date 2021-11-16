const watchPackage = require("./watchPackage");
const { prepareOptions } = require("../utils");

module.exports = config => async options => {
    const preparedOptions = prepareOptions({ config, options });
    return watchPackage(preparedOptions);
};
