if (process.env.NODE_ENV === "development") {
    module.exports = require("./development").default;
} else {
    module.exports = require("./production").default;
}
