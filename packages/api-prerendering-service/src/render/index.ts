import renderPage from "./renderPage";
import path from "path";
import S3 from "aws-sdk/clients/s3";
import getStorageName from "./../utils/getStorageName";
import getStorageFolder from "./../utils/getStorageFolder";
import getDbNamespace from "./../utils/getDbNamespace";
import getRenderUrl from "./../utils/getRenderUrl";
import { HandlerPlugin, Configuration, RenderHookPlugin } from "./types";
import { DbRender, HandlerResponse } from "@webiny/api-prerendering-service/types";
import debug from "debug";
import defaults from "./../utils/defaults";
import omit from "lodash/omit";

const s3 = new S3({ region: process.env.AWS_REGION });

const log = debug("wby:api-prerendering-service:render");

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

export default (configuration?: Configuration): HandlerPlugin => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        const { invocationArgs } = context;
        const handlerArgs = Array.isArray(invocationArgs) ? invocationArgs : [invocationArgs];
        const handlerHookPlugins = context.plugins.byType<RenderHookPlugin>("ps-render-hook");

        const promises = [];

        log("Received args: ", JSON.stringify(invocationArgs));

        try {
            for (let i = 0; i < handlerArgs.length; i++) {
                const args = handlerArgs[i];

                promises.push(
                    new Promise(async resolve => {
                        const dbNamespace = getDbNamespace(args, configuration);
                        const storageName = getStorageName(args, configuration);
                        const storageFolder = getStorageFolder(args, configuration);
                        const url = getRenderUrl(args, configuration);

                        // Check if render data for given URL already exists. If so, delete it.
                        const PK = [dbNamespace, "PS", "RENDER"].filter(Boolean).join("#");
                        const [[render]] = await context.db.read<DbRender>({
                            ...defaults.db,
                            query: {
                                PK,
                                SK: url
                            }
                        });

                        // TODO: will need to add flushing of all files created in the render process.
                        if (render) {
                            await context.db.delete({
                                ...defaults.db,
                                query: {
                                    PK,
                                    SK: url
                                }
                            });
                        }

                        for (let j = 0; j < handlerHookPlugins.length; j++) {
                            const plugin = handlerHookPlugins[j];
                            if (typeof plugin.beforeRender === "function") {
                                await plugin.beforeRender({
                                    log,
                                    context,
                                    configuration,
                                    args
                                });
                            }
                        }

                        const files = await renderPage(url, {
                            log
                        });

                        for (let j = 0; j < files.length; j++) {
                            const file = files[j];
                            const key = path.join(storageFolder, file.name);

                            log(`Storing file "${key}" to storage "${storageName}".`);
                            await storeFile({
                                storageName,
                                key,
                                body: file.body,
                                contentType: file.type
                            });
                        }

                        await context.db.create({
                            ...defaults.db,
                            data: {
                                PK,
                                SK: url,
                                TYPE: "ps.render",
                                url,
                                args,
                                configuration,
                                files: files.map(item => omit(item, ["body"]))
                            }
                        });

                        for (let j = 0; j < handlerHookPlugins.length; j++) {
                            const plugin = handlerHookPlugins[j];
                            if (typeof plugin.afterRender === "function") {
                                await plugin.afterRender({
                                    log,
                                    context,
                                    configuration,
                                    args
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
