require("babel-register");
const { setupWebinyApi } = require("./setup/index");

setupWebinyApi().then(() => {
    process.exit();
});
