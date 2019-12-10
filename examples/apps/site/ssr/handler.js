/**
 * It is absolutely mandatory to clear module cache for Apollo to generate the correct state!
 */
module.exports.handler = async event => {
    const path = event.path.replace("/ssr", "");
    delete require.cache[require.resolve("./ssr")];
    const { renderer } = require("./ssr");
    const { html } = await renderer(path);

    try {
        return {
            statusCode: 200,
            body: html,
            headers: { "Cache-Control": "no-store", "Content-Type": "text/html" }
        };
    } catch (e) {
        return {
            statusCode: 500,
            type: "text/html",
            body: e.stack,
            headers: { "Cache-Control": "no-store", "Content-Type": "text/html" }
        };
    }
};
