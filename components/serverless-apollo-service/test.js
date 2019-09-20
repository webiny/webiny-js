const fs = require("fs");
const { transform } = require("@babel/core");
const prettier = require("prettier");

(async () => {
    const source = fs.readFileSync("./boilerplate/handler.js");
    const { code } = await transform(source, {
        plugins: [["./transform/plugins", { plugins: ["plugin-1", "plugin-2"] }]]
    });

    console.log(prettier.format(code));
})();
