const checkTeamsLicense = async (args, context) => {
    const { featureFlags } = require("@webiny/feature-flags");

    if (!featureFlags?.aacl?.teams) {
        return;
    }

    const projectEnvironmentApiKey = process.env.WCP_PROJECT_ENVIRONMENT_API_KEY;
    if (!projectEnvironmentApiKey) {
        throw new Error(
            "Cannot continue because the Teams feature has been enabled, but the project wasn't linked with Webiny Control Panel (WCP)."
        );
    }

    const { getWcpProjectLicense } = require("@webiny/wcp");
    const { getWcpOrgProjectId } = require("./utils");

    const [orgId, projectId] = await getWcpOrgProjectId(context);

    const projectLicense = await getWcpProjectLicense({
        orgId,
        projectId,
        projectEnvironmentApiKey
    });

    if (!projectLicense?.package?.features?.advancedAccessControlLayer?.options?.teams) {
        throw new Error(
            "Cannot continue because the Teams feature has been enabled, but the project doesn't have access to it."
        );
    }
};

// Export hooks plugins for deploy and watch commands.
module.exports = () => [
    // Deploy hook handlers.
    {
        type: "hook-before-watch",
        name: "hook-before-watch-aacl",
        hook: checkTeamsLicense
    },
    {
        type: "hook-before-deploy",
        name: "hook-before-deploy-aacl",
        hook: checkTeamsLicense
    }
];
