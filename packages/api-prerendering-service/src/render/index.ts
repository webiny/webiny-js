import renderUrl, { File } from "./renderUrl";
import { join } from "path";
import S3 from "aws-sdk/clients/s3";
import { getStorageFolder, getRenderUrl, getIsNotFoundPage } from "~/utils";
import { HandlerArgs, RenderHookPlugin } from "./types";
import { PrerenderingServiceStorageOperations, Render, TagPathLink } from "~/types";
import omit from "lodash/omit";
import { HandlerPlugin } from "@webiny/handler";
import { Context } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";

export interface HandlerContext extends Context, ArgsContext<HandlerArgs> {
    //
}

const sleep = () => new Promise(resolve => setTimeout(resolve, 1000));

const s3 = new S3({ region: process.env.AWS_REGION });

interface StoreFileParams {
    key: string;
    contentType: string;
    body: string;
    storageName: string;
}
const storeFile = (params: StoreFileParams) => {
    const { storageName, key, contentType, body } = params;
    return s3
        .putObject({
            Bucket: storageName,
            Key: key,
            ACL: "public-read",
            ContentType: contentType,
            CacheControl: "max-age=30",
            Body: body
        })
        .promise();
};

export interface RenderParams {
    storageOperations: PrerenderingServiceStorageOperations;
}

const NOT_FOUND_FOLDER = "_NOT_FOUND_PAGE_";

function isMultiTenancyEnabled() {
    // This check is for backwards compatibility with pre-5.29.0 projects.
    if (process.env.WEBINY_MULTI_TENANCY === "true") {
        return true;
    }

    // For >=5.29.0 projects, check for `WCP_PROJECT_ENVIRONMENT` variable.
    return process.env.hasOwnProperty("WCP_PROJECT_ENVIRONMENT");
}

export default (params: RenderParams) => {
    const { storageOperations } = params;
    const isMultiTenant = isMultiTenancyEnabled();
    const log = console.log;

    return new HandlerPlugin<HandlerContext>(async context => {
        const { invocationArgs } = context;
        const handlerArgs = Array.isArray(invocationArgs) ? invocationArgs : [invocationArgs];
        const handlerHookPlugins = context.plugins.byType<RenderHookPlugin>("ps-render-hook");

        try {
            await sleep();

            const settings = await storageOperations.getSettings();

            for (const args of handlerArgs) {
                const { tenant, path, locale } = args;

                const bucketRoot = isMultiTenant ? tenant : "";

                for (const plugin of handlerHookPlugins) {
                    if (typeof plugin.beforeRender === "function") {
                        await plugin.beforeRender({
                            log,
                            context,
                            render: args,
                            settings
                        });
                    }
                }

                const storageName = settings.bucket;
                const storageFolder = getStorageFolder(path);
                const url = getRenderUrl(path, settings);
                const isNotFound = getIsNotFoundPage(args);

                // Check if render data for given URL already exists. If so, delete it.
                const currentRender = await storageOperations.getRender({
                    where: {
                        tenant,
                        path
                    }
                });

                // TODO: will need to add flushing of all files created in the render process.
                const [files] = await renderUrl(url, {
                    context,
                    args
                });

                for (const file of files) {
                    const key = join(bucketRoot, storageFolder, file.name);

                    console.log(`Storing file "${key}" to storage "${storageName}".`);
                    await storeFile({
                        storageName,
                        key,
                        body: file.body,
                        contentType: file.type
                    });

                    if (isNotFound) {
                        const key = join(bucketRoot, NOT_FOUND_FOLDER, file.name);

                        console.log(`Storing file "${key}" to storage "${storageName}".`);
                        await storeFile({
                            storageName,
                            key,
                            body: file.body,
                            contentType: file.type
                        });
                    }
                }

                const render: Render = {
                    tenant,
                    path,
                    locale,
                    tags: args.tags,
                    files: files.map(item => omit(item, ["body"]))
                };

                await storageOperations.createRender({
                    render
                });

                // Let's delete existing tag / URL links.
                // TODO: improve - no need to do any DB calls if tags didn't change. So, let's
                // TODO: compare tags in `currentIndexHtml` and `newIndexHtml`.
                console.log("Checking if there are existing tag / URL links to remove...");
                if (currentRender) {
                    // Get currently stored tags and delete all tag-URL links.
                    const currentIndexHtml = currentRender.files.find(item =>
                        item.name.endsWith(".html")
                    );
                    const currentIndexHtmlTags = currentIndexHtml?.meta?.tags;
                    if (Array.isArray(currentIndexHtmlTags) && currentIndexHtmlTags.length) {
                        console.log(
                            "There are existing tag / URL links to be deleted...",
                            currentIndexHtmlTags
                        );

                        await storageOperations.deleteTagPathLinks({
                            tenant,
                            path,
                            tags: currentIndexHtmlTags
                        });
                        console.log("Existing tag / URL links deleted.");
                    } else {
                        console.log("There are no existing tag / URL links to delete.");
                    }
                }

                // Let's save tags - we link each distinct tag with the URL.
                console.log("Checking if there are new tag / URL links to save...");
                const newIndexHtml = files.find((item: File) => item.name.endsWith(".html"));
                const newIndexHtmlTags = newIndexHtml?.meta?.tags;
                if (Array.isArray(newIndexHtmlTags) && newIndexHtmlTags.length) {
                    console.log("There are new tag / URL links to be saved...", newIndexHtmlTags);

                    const tagPathLinks: TagPathLink[] = newIndexHtmlTags.map(tag => {
                        return {
                            path,
                            tenant,
                            key: tag.key,
                            value: tag.value
                        };
                    });

                    await storageOperations.createTagPathLinks({
                        tagPathLinks
                    });
                    console.log("New tag / URL links saved.");
                } else {
                    console.log("There are no new tag / URL links to save.");
                }

                for (let j = 0; j < handlerHookPlugins.length; j++) {
                    const plugin = handlerHookPlugins[j];
                    if (typeof plugin.afterRender === "function") {
                        await plugin.afterRender({
                            log,
                            context,
                            render: args,
                            settings
                        });
                    }
                }
            }

            return {
                data: null,
                error: null
            };
        } catch (e) {
            console.log("An error occurred while prerendering...", e);
            console.log(JSON.stringify(e.message));
            return {
                data: null,
                error: e
            };
        }
    });
};
