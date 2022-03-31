const { localStorage } = require("@webiny/cli/utils");

module.exports.setWcpPat = wcpPat => {
    localStorage().set("wcpPat", wcpPat);
};
