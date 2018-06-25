const { argv } = require("yargs");
if (argv.require) {
    Array.isArray(argv.require) ? argv.require.map(r => require(r)) : require(argv.require);
}

require("./../app/index")
    .default()
    .then(app => {
        app.listen(argv.port, () => {
            console.log(`Express listening on ${argv.port}...`);
        });
    });
