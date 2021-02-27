import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";

export default async () => {
    tagResources({
        WbyProjectName: process.env.WEBINY_PROJECT_NAME as string,
        WbyEnvironment: process.env.WEBINY_ENV as string
    });

    const { setup } = await import("./default");

    return setup();
};
