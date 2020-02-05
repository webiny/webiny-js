const generateIndex = require("./buildSteps/generateIndex");

module.exports = async () => {
    const appIndexJs = await generateIndex();
    require("./scripts/start")({ appIndexJs });
};
