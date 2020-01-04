/**
 * It is absolutely mandatory to clear module cache for Apollo to generate the correct state!
 */
module.exports.handler = async ({ path }) => {
    delete require.cache[require.resolve("./ssr")];
    const { ssr } = require("./ssr");
    const { html } = await ssr(path);

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
