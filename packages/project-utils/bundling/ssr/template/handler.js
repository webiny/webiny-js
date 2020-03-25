module.exports.handler = async event => {
    const { url } = event;
    // It is absolutely mandatory to clear module cache for Apollo to generate the correct state!
    delete require.cache[require.resolve("./renderer")];
    const { renderer } = require("./renderer");
    return await renderer(url);
};
