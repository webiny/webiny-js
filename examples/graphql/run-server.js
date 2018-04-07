const { argv } = require("yargs");
if (argv.require) {
    Array.isArray(argv.require) ? argv.require.map(r => require(r)) : require(argv.require);
}

const app = require("./src/graphql").default();
app.listen(9000, () => {
    console.log("API is listening on 9000...");
});
