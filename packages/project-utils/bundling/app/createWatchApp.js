const watchApp = require("./watchApp");
const { prepareOptions } = require("../../utils");

module.exports = config => async options => {
    const preparedOptions = prepareOptions({ config, options });
    return watchApp(preparedOptions);
};
