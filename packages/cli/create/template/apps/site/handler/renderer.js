/**
 * This file is needed to clear require.cache entry for "./ssr" each time a render is executed.
 * It is absolutely mandatory to clear module cache for Apollo to generate the correct state.
 * We can't do this in the `handler` itself, as the handler is processed by webpack, and webpack does
 * its magic with __webpack_require__ which for some reason breaks the ability to clear cache.
 */
module.exports = async url => {
    delete require.cache[require.resolve("./ssr")];
    const { renderer } = require("./ssr");
    return await renderer(url);
};
