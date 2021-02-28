import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";

export = async () => {
    // Add tags to all resources that support tagging.
    tagResources({
        WbyProjectName: process.env.WEBINY_PROJECT_NAME as string,
        WbyEnvironment: process.env.WEBINY_ENV as string
    });

    // Import resources factory.
    return await import("./benchmark").then(module => {
        // Configure resources and return the expected outputs.
        return module.default();
    });
};
