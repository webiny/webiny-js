const { argv } = require("yargs");
if (argv.require) {
    Array.isArray(argv.require) ? argv.require.map(r => require(r)) : require(argv.require);
}

const app = require("./../app/index").default();
app.listen(argv.port, () => {
    console.log(`Express listening on ${argv.port}...`);
});
