import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import renderPage from "./renderPage";
import path from "path";
import S3 from "aws-sdk/clients/s3";

const s3 = new S3({ region: process.env.AWS_REGION });

export type Configuration = {
    website?: {
        url?: string;
    };
    storage?: {
        name?: string;
        folder?: string;
    };
};

export type Args = {
    configuration?: Configuration;
    url?: string;
    path?: string;
};

export type HandlerArgs = Args | Args[];
export type HandlerResponse = { data: Record<string, any>; error: Record<string, any> };

const log = (message, ...rest) => console.log(`[api-prerendering-service] ${message}`, ...rest);

export default (configuration?: Configuration): HandlerPlugin<ArgsContext<HandlerArgs>> => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        const { invocationArgs } = context;
        const handlerArgs = Array.isArray(invocationArgs) ? invocationArgs : [invocationArgs];

        const promises = [];

        log("Received args: ", JSON.stringify(invocationArgs));

        try {
            for (let i = 0; i < handlerArgs.length; i++) {
                const args = handlerArgs[i];

                promises.push(
                    new Promise(async resolve => {
                        const url = getRenderUrl(args, configuration);
                        const files = await renderPage(url);

                        const storageName = getStorageName(args, configuration);
                        const storageFolder = getStorageFolder(args, configuration);

                        for (let j = 0; j < files.length; j++) {
                            const file = files[j];

                            const key = path.join(storageFolder, file.name);

                            await storeFile({
                                storageName,
                                key,
                                body: file.body,
                                contentType: file.type
                            });
                        }
                        resolve();
                    })
                );
            }

            await Promise.all(promises);

            return { data: null, error: null };
        } catch (e) {
            return { data: null, error: e };
        }
    }
});

const getRenderUrl = (args: Args, configuration: Configuration) => {
    if (args.url) {
        return args.url;
    }

    const websiteUrl = args?.configuration?.website.url || configuration?.website?.url;
    return path.join(websiteUrl, args.path);
};

const getStorageName = (args: Args, configuration: Configuration) => {
    return args?.configuration?.storage.name || configuration?.storage.name;
};

const getStorageFolder = (args: Args, configuration: Configuration) => {
    return args?.configuration?.storage.folder || configuration?.storage.folder;
};

const storeFile = ({ key, contentType, body, storageName }) => {
    return s3
        .putObject({
            Bucket: storageName,
            Key: key,
            ACL: "public-read",
            ContentType: contentType,
            Body: body
        })
        .promise();
};
