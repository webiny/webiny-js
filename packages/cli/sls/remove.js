const execute = require("./execute");

module.exports = async inputs => {
    const { what } = inputs;
    await execute(inputs, "remove");

    let message;
    if (what === "api") {
        message = `Your API was removed.`;
    }

    if (what === "apps") {
        message = `Your apps were removed.`;
    }
    console.log(`\n🎉 Done! ${message}`);
};
