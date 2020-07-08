/**
 * It is absolutely mandatory to clear module cache for Apollo to generate the correct state!
 */
module.exports.handler = async event => {
    const { url } = event;
    delete require.cache[require.resolve("./ssr")];
    const { renderer } = require("./ssr");
    return await renderer(url);
};
