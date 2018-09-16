// @flowIgnore
const path = require("path");
const { bootstrap } = require("commitizen/dist/cli/git-cz");

bootstrap({
    cliPath: path.join(__dirname, "../node_modules/commitizen"),
    // this is new
    config: {
        path: __dirname + "/cz-adapter"
    }
});
