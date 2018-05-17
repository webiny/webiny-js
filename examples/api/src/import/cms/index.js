require("babel-register");

const { default: create } = require("./create");
create().then(() => {
    process.exit(0);
});
