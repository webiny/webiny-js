const { argv } = require("yargs");
if (argv.require) {
    Array.isArray(argv.require) ? argv.require.map(r => require(r)) : require(argv.require);
}

require("./express")
    .default()
    .then(app => {
        app.listen(9000, () => {
            console.log("API is listening on 9000...");
        });
    });
