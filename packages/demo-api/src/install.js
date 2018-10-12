const path = require("path");

require("@babel/register")({
    configFile: path.resolve(__dirname + "/../../../babel.config.js"),
    only: [/packages/]
});

require("./install/install").default();
