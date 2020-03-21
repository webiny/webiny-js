module.exports.handler = async ({ path }) => {
    delete require.cache[require.resolve("./ssr")];
    const { ssr } = require("./ssr");
    const { html } = await ssr(path);
    return html;
};
