const { handler } = require("./build/ssr");
const event = require("./event");

(async () => {
    const output = await handler(event);
    //console.log(output);
})();
