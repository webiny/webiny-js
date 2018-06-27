if (process.env.NODE_ENV === "production") {
    module.exports = require("./production").default;
} else {
    module.exports = require("./development").default;
}
