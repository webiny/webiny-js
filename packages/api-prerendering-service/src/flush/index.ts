import S3 from "aws-sdk/clients/s3";
import getStorageName from "./../utils/getStorageName";
import getStorageFolder from "./../utils/getStorageFolder";
import getDbNamespace from "./../utils/getDbNamespace";
import getRenderUrl from "./../utils/getRenderUrl";
import { HandlerPlugin, Configuration, FlushHookPlugin } from "./types";
import { HandlerResponse, DbRender } from "@webiny/api-prerendering-service/types";
import debug from "debug";
import defaults from "./../utils/defaults";
import path from "path";

const s3 = new S3({ region: process.env.AWS_REGION });

const log = debug("wby:api-prerendering-service:flush");

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
        const { invocationArgs } = context;
        const handlerArgs = Array.isArray(invocationArgs) ? invocationArgs : [invocationArgs];
        const handlerHookPlugins = context.plugins.byType<FlushHookPlugin>("ps-flush-hook");

        const promises = [];

        log("Received args: ", JSON.stringify(invocationArgs));

        try {
            for (let i = 0; i < handlerArgs.length; i++) {
                const args = handlerArgs[i];

                promises.push(
                    new Promise(async resolve => {
                        const dbNamespace = getDbNamespace(args, configuration);
                        const url = getRenderUrl(args, configuration);
                        const PK = [dbNamespace, "PS", "RENDER"].filter(Boolean).join("#");
                        const [[render]] = await context.db.read<DbRender>({
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
                                    render
                                });
                            }
                        }

                        if (render) {
                            const storageName = getStorageName(render.args, render.configuration);
                            const storageFolder = getStorageFolder(
                                render.args,
                                render.configuration
                            );

                            if (Array.isArray(render.files)) {
                                for (let j = 0; j < render.files.length; j++) {
                                    const file = render.files[j];
                                    const key = path.join(storageFolder, file.name);
                                    await deleteFile({ key, storageName });
                                }
                            }
                        }

                        await context.db.delete({
                            ...defaults.db,
                            query: {
                                PK: render.PK,
                                SK: render.SK
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
                                    render
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
