const { localStorage } = require("@webiny/cli/utils");

module.exports.getWcpPat = wcpPat => {
    return localStorage().get("wcpPat", wcpPat);
};
