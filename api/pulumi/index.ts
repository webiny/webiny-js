import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";

export = async () => {
    // Add tags to all resources that support tagging.
    tagResources({
        WbyProjectName: process.env.WEBINY_PROJECT_NAME as string,
        WbyEnvironment: process.env.WEBINY_ENV as string
    });

    if (process.env.WEBINY_ENV === "prod") {
        // Import "prod" resources config and initialize resources.
        return await import("./prod").then(module => module.default());
    }

    // Import "dev" resources config and initialize resources.
    return await import("./dev").then(module => module.default());
};
