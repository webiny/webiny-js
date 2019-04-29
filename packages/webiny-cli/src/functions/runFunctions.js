const chalk = require("chalk");
const { argv } = require("yargs");
const appFactory = require("./appFactory");

const app = appFactory();

const port = argv.port || 9000;
app.listen(port, () => {
    console.log(chalk.cyan(`🚀 Functions running on port ${port}.`));
});
