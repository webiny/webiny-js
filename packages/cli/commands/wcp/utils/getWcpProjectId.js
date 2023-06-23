module.exports.getWcpProjectId = context => {
    return context?.project?.config?.id || process.env.WCP_PROJECT_ID || "";
};
