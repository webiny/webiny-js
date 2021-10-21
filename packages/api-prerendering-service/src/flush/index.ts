import S3 from "aws-sdk/clients/s3";
import getStorageName from "~/utils/getStorageName";
import getStorageFolder from "~/utils/getStorageFolder";
import getDbNamespace from "~/utils/getDbNamespace";
import getRenderUrl from "~/utils/getRenderUrl";
import { HandlerPlugin, Configuration, FlushHookPlugin } from "./types";
import { HandlerResponse, PrerenderingServiceStorageOperations } from "~/types";
import path from "path";

const s3 = new S3({ region: process.env.AWS_REGION });

const deleteFile = ({ key, storageName }) => {
    return s3
        .deleteObject({
            Bucket: storageName,
            Key: key
        })
        .promise();
};

export interface Params extends Configuration {
    storageOperations: PrerenderingServiceStorageOperations;
}

export default (configuration: Params): HandlerPlugin => {
    const { storageOperations } = configuration;
    return {
        type: "handler",
        async handle(context): Promise<HandlerResponse> {
            const log = console.log;
            const { invocationArgs } = context;
            const handlerArgs = Array.isArray(invocationArgs) ? invocationArgs : [invocationArgs];
            const handlerHookPlugins = context.plugins.byType<FlushHookPlugin>("ps-flush-hook");

            const promises = [];

            log("Received args: ", JSON.stringify(invocationArgs));

            try {
                for (let i = 0; i < handlerArgs.length; i++) {
                    const args = handlerArgs[i];

                    promises.push(
                        new Promise(async (resolve?: any) => {
                            const dbNamespace = getDbNamespace(args, configuration);
                            const url = getRenderUrl(args, configuration);

                            const currentRender = await storageOperations.getRender({
                                where: {
                                    namespace: dbNamespace,
                                    url
                                }
                            });

                            for (let j = 0; j < handlerHookPlugins.length; j++) {
                                const plugin = handlerHookPlugins[j];
                                if (typeof plugin.beforeFlush === "function") {
                                    await plugin.beforeFlush({
                                        log,
                                        context,
                                        configuration,
                                        args,
                                        render: currentRender
                                    });
                                }
                            }

                            if (currentRender) {
                                const storageName = getStorageName(
                                    currentRender.args,
                                    currentRender.configuration
                                );
                                const storageFolder = getStorageFolder(
                                    currentRender.args,
                                    currentRender.configuration
                                );

                                if (Array.isArray(currentRender.files)) {
                                    for (const file of currentRender.files) {
                                        const key = path.join(storageFolder, file.name);
                                        await deleteFile({ key, storageName });
                                    }

                                    // Let's delete existing tag / URL links.
                                    log(
                                        "Checking if there are existing tag / URL links to remove..."
                                    );

                                    // Get currently stored tags and delete all tag-URL links.
                                    const currentIndexHtml = currentRender.files.find(item =>
                                        item.name.endsWith(".html")
                                    );

                                    const currentIndexHtmlTags = currentIndexHtml?.meta?.tags;
                                    if (
                                        Array.isArray(currentIndexHtmlTags) &&
                                        currentIndexHtmlTags.length
                                    ) {
                                        log(
                                            "There are existing tag / URL links to be deleted...",
                                            currentIndexHtmlTags
                                        );

                                        await storageOperations.deleteTagUrlLinks({
                                            tags: currentIndexHtmlTags,
                                            namespace: dbNamespace,
                                            url
                                        });

                                        log("Existing tag / URL links deleted.");
                                    } else {
                                        log("There are no existing tag / URL links to delete.");
                                    }
                                }
                            }

                            await storageOperations.deleteRender({
                                render: currentRender
                            });

                            for (let j = 0; j < handlerHookPlugins.length; j++) {
                                const plugin = handlerHookPlugins[j];
                                if (typeof plugin.afterFlush === "function") {
                                    await plugin.afterFlush({
                                        log,
                                        context,
                                        configuration,
                                        args,
                                        render: currentRender
                                    });
                                }
                            }

                            resolve();
                        })
                    );
                }

                await Promise.all(promises);

                return { data: null, error: null };
            } catch (e) {
                log("An error occurred while prerendering...", e);
                return { data: null, error: e };
            }
        }
    };
};
