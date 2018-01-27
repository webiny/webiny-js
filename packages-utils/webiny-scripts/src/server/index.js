module.exports =
    process.env.NODE_ENV === "production" ? require("./production") : require("./development");
