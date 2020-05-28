import { ContextFilesGetSettings } from "@webiny/api-files/types";
import LambdaClient from "aws-sdk/clients/lambda";
import { Context } from "@webiny/graphql/types";
import files from "./files"

let filesSettingsCache;

type ServicePluginsOptions = { filesFunction: string };

export default (options: ServicePluginsOptions) => {
    if (!options.filesFunction) {
        throw new Error(`Files service plugins error - "filesFunction" not specified.`);
    }

    return [
        files,
        {
            name: "context-files-get-settings",
            type: "context-files-get-settings",
            async resolve() {
                if (Array.isArray(filesSettingsCache)) {
                    return filesSettingsCache;
                }

                const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
                const { Payload } = await Lambda.invoke({
                    FunctionName: options.filesFunction
                }).promise();

                let parsedPayload;

                try {
                    parsedPayload = JSON.parse(Payload as string);
                } catch (e) {
                    throw new Error("Could not JSON.parse DB Proxy's response.");
                }

                filesSettingsCache = parsedPayload;
                return filesSettingsCache;
            }
        } as ContextFilesGetSettings<Context>
    ];
};
