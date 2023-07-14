const { getWcpProjectId } = require("./getWcpProjectId");

module.exports.getWcpOrgProjectId = context => {
    const id = getWcpProjectId(context);
    if (typeof id === "string") {
        return id.split("/");
    }
    return [];
};
