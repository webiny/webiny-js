const buildApp = require("./buildApp");
const { prepareOptions } = require("../../utils");

module.exports = config => async options => {
    const preparedOptions = prepareOptions({ config, options });
    return buildApp(preparedOptions);
};
