import { S3 } from "@webiny/aws-sdk/client-s3";
import { join } from "path";
import WebinyError from "@webiny/error";
import { getStorageFolder, isMultiTenancyEnabled } from "~/utils";
import { FlushHookPlugin, HandlerArgs } from "./types";
import { PrerenderingServiceStorageOperations } from "~/types";
import { EventPlugin } from "@webiny/handler";

const s3 = new S3({ region: process.env.AWS_REGION });

interface DeleteFileParams {
    key: string;
    storageName: string;
}

const deleteFile = ({ key, storageName }: DeleteFileParams) => {
    return s3.deleteObject({
        Bucket: storageName,
        Key: key
    });
};

export interface Params {
    storageOperations: PrerenderingServiceStorageOperations;
}

export default (configuration: Params) => {
    const { storageOperations } = configuration;
    const isMultiTenant = isMultiTenancyEnabled();

    return new EventPlugin<HandlerArgs>(async ({ payload, context }) => {
        const log = console.log;
        const events = Array.isArray(payload) ? payload : [payload];
        const handlerHookPlugins = context.plugins.byType<FlushHookPlugin>("ps-flush-hook");

        const settings = await storageOperations.getSettings();

        log("Received args: ", JSON.stringify(payload));

        try {
            const promises = events.map(event => {
                const { tenant, path } = event;

                if (!path) {
                    return;
                }

                const bucketRoot = isMultiTenant ? tenant : "";

                return new Promise(async (resolve?: any) => {
                    const render = await storageOperations.getRender({
                        where: { path, tenant }
                    });

                    if (!render) {
                        return resolve();
                    }

                    for (let j = 0; j < handlerHookPlugins.length; j++) {
                        const plugin = handlerHookPlugins[j];
                        if (typeof plugin.beforeFlush === "function") {
                            await plugin.beforeFlush({
                                log,
                                context,
                                render,
                                settings
                            });
                        }
                    }

                    if (render) {
                        const storageFolder = getStorageFolder(path);

                        if (Array.isArray(render.files)) {
                            for (const file of render.files) {
                                const key = join(bucketRoot, storageFolder, file.name);
                                await deleteFile({ key, storageName: settings.bucket });
                            }

                            // Let's delete existing tag -> URL links.
                            log("Checking if there are existing tag -> URL links to remove...");

                            // Get currently stored tags and delete all tag-URL links.
                            const currentIndexHtml = render.files.find(item =>
                                item.name.endsWith(".html")
                            );

                            const currentIndexHtmlTags = currentIndexHtml?.meta?.tags;
                            if (
                                Array.isArray(currentIndexHtmlTags) &&
                                currentIndexHtmlTags.length
                            ) {
                                log(
                                    "There are existing tag -> URL links to be deleted...",
                                    currentIndexHtmlTags
                                );

                                await storageOperations.deleteTagPathLinks({
                                    tags: currentIndexHtmlTags,
                                    tenant,
                                    path
                                });

                                log("Existing tag -> URL links deleted.");
                            } else {
                                log("There are no existing tag -> URL links to delete.");
                            }
                        }

                        try {
                            await storageOperations.deleteRender({
                                render
                            });
                        } catch (ex) {
                            throw new WebinyError(
                                "Error while deleting render.",
                                "DELETE_RENDER_ERROR",
                                {
                                    render
                                }
                            );
                        }
                    }

                    for (let j = 0; j < handlerHookPlugins.length; j++) {
                        const plugin = handlerHookPlugins[j];
                        if (typeof plugin.afterFlush !== "function") {
                            continue;
                        }
                        try {
                            await plugin.afterFlush({
                                log,
                                context,
                                render,
                                settings
                            });
                        } catch (ex) {
                            throw new WebinyError(
                                "Error while running after flush.",
                                "AFTER_FLUSH_ERROR",
                                {
                                    event,
                                    render
                                }
                            );
                        }
                    }

                    resolve();
                });
            });

            await Promise.all(promises);

            return {
                data: null,
                error: null
            };
        } catch (ex) {
            console.error("An error occurred while prerendering...", ex);
            return {
                data: null,
                error: ex
            };
        }
    });
};
