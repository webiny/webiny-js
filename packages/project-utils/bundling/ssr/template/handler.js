/**
 * It is absolutely mandatory to clear module cache for Apollo to generate the correct state!
 */
module.exports.handler = async ({ path }) => {
    try {
        delete require.cache[require.resolve("./renderer")];
        const { renderer } = require("./renderer");
        const { html } = await renderer(path);
        return {
            error: false,
            body: html
        };
    } catch (e) {
        return {
            error: true,
            body: "Server Side Rendering (SSR) error occurred:\n" + (e.stack || e.message || e)
        };
    }
};