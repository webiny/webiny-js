import S3 from "aws-sdk/clients/s3";
import getStorageName from "./../utils/getStorageName";
import getStorageFolder from "./../utils/getStorageFolder";
import getDbNamespace from "./../utils/getDbNamespace";
import getRenderUrl from "./../utils/getRenderUrl";
import { HandlerPlugin, Configuration, FlushHookPlugin } from "./types";
import { HandlerResponse, DbRender } from "../types";
import defaults from "./../utils/defaults";
import path from "path";
import getTagUrlLinkPKSK from "./../utils/getTagUrlLinkPKSK";

const s3 = new S3({ region: process.env.AWS_REGION });

const deleteFile = ({ key, storageName }) => {
    return s3
        .deleteObject({
            Bucket: storageName,
            Key: key
        })
        .promise();
};

export default (configuration?: Configuration): HandlerPlugin => ({
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
                        const PK = [dbNamespace, "PS", "RENDER"].filter(Boolean).join("#");
                        const [[currentRenderData]] = await context.db.read<DbRender>({
                            ...defaults.db,
                            query: {
                                PK,
                                SK: url
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
                                    render: currentRenderData
                                });
                            }
                        }

                        if (currentRenderData) {
                            const storageName = getStorageName(
                                currentRenderData.args,
                                currentRenderData.configuration
                            );
                            const storageFolder = getStorageFolder(
                                currentRenderData.args,
                                currentRenderData.configuration
                            );

                            if (Array.isArray(currentRenderData.files)) {
                                for (let j = 0; j < currentRenderData.files.length; j++) {
                                    const file = currentRenderData.files[j];
                                    const key = path.join(storageFolder, file.name);
                                    await deleteFile({ key, storageName });
                                }

                                // Let's delete existing tag / URL links.
                                log("Checking if there are existing tag / URL links to remove...");

                                // Get currently stored tags and delete all tag-URL links.
                                const currentIndexHtml = currentRenderData.files.find(item =>
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
                                    const batch = context.db.batch();

                                    for (let k = 0; k < currentIndexHtmlTags.length; k++) {
                                        const tag = currentIndexHtmlTags[k];
                                        const [PK, SK] = getTagUrlLinkPKSK({
                                            tag,
                                            url,
                                            dbNamespace
                                        });

                                        if (PK && SK) {
                                            batch.delete({ query: { PK, SK } });
                                        }
                                    }

                                    await batch.execute();
                                    log("Existing tag / URL links deleted.");
                                } else {
                                    log("There are no existing tag / URL links to delete.");
                                }
                            }
                        }

                        await context.db.delete({
                            ...defaults.db,
                            query: {
                                PK: currentRenderData.PK,
                                SK: currentRenderData.SK
                            }
                        });

                        for (let j = 0; j < handlerHookPlugins.length; j++) {
                            const plugin = handlerHookPlugins[j];
                            if (typeof plugin.afterFlush === "function") {
                                await plugin.afterFlush({
                                    log,
                                    context,
                                    configuration,
                                    args,
                                    render: currentRenderData
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
});
