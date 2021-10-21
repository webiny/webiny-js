import renderUrl, { File } from "./renderUrl";
import path from "path";
import S3 from "aws-sdk/clients/s3";
import getStorageName from "./../utils/getStorageName";
import getStorageFolder from "./../utils/getStorageFolder";
import getDbNamespace from "./../utils/getDbNamespace";
import getRenderUrl from "./../utils/getRenderUrl";
import getTagUrlLinkPKSK from "./../utils/getTagUrlLinkPKSK";
import { HandlerPlugin, Configuration, RenderHookPlugin } from "./types";
import { DbRender, TYPE, HandlerResponse, DbTagUrlLink } from "~/types";
import defaults from "./../utils/defaults";
import omit from "lodash/omit";

const sleep = () => new Promise(resolve => setTimeout(resolve, 1000));

const s3 = new S3({ region: process.env.AWS_REGION });

const storeFile = ({ key, contentType, body, storageName }) => {
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

export default (configuration?: Configuration): HandlerPlugin => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        const { invocationArgs } = context;
        const handlerArgs = Array.isArray(invocationArgs) ? invocationArgs : [invocationArgs];
        const handlerHookPlugins = context.plugins.byType<RenderHookPlugin>("ps-render-hook");

        console.log("Received args: ", JSON.stringify(invocationArgs));

        try {
            await sleep();
            for (let i = 0; i < handlerArgs.length; i++) {
                const args = handlerArgs[i];

                for (let j = 0; j < handlerHookPlugins.length; j++) {
                    const plugin = handlerHookPlugins[j];
                    if (typeof plugin.beforeRender === "function") {
                        await plugin.beforeRender({
                            context,
                            configuration,
                            args
                        });
                    }
                }

                const dbNamespace = getDbNamespace(args, configuration);
                const storageName = getStorageName(args, configuration);
                const storageFolder = getStorageFolder(args, configuration);
                const url = getRenderUrl(args, configuration);

                // Check if render data for given URL already exists. If so, delete it.
                const PK = [dbNamespace, "PS", "RENDER"].filter(Boolean).join("#");
                const [[currentRenderData]] = await context.db.read<DbRender>({
                    ...defaults.db,
                    query: {
                        PK,
                        SK: url
                    }
                });

                // TODO: will need to add flushing of all files created in the render process.
                const [files] = await renderUrl(url, {
                    context,
                    configuration,
                    args
                });

                for (let j = 0; j < files.length; j++) {
                    const file = files[j];
                    const key = path.join(storageFolder, file.name);

                    console.log(`Storing file "${key}" to storage "${storageName}".`);
                    await storeFile({
                        storageName,
                        key,
                        body: file.body,
                        contentType: file.type
                    });
                }

                const data: DbRender = {
                    PK,
                    SK: url,
                    TYPE: TYPE.DbRender,
                    url,
                    args,
                    configuration,
                    files: files.map(item => omit(item, ["body"]))
                };

                await context.db.create({
                    ...defaults.db,
                    data
                });

                // Let's delete existing tag / URL links.
                // TODO: improve - no need to do any DB calls if tags didn't change. So, let's
                // TODO: compare tags in `currentIndexHtml` and `newIndexHtml`.
                console.log("Checking if there are existing tag / URL links to remove...");
                if (currentRenderData) {
                    // Get currently stored tags and delete all tag-URL links.
                    const currentIndexHtml = currentRenderData.files.find(item =>
                        item.name.endsWith(".html")
                    );
                    const currentIndexHtmlTags = currentIndexHtml?.meta?.tags;
                    if (Array.isArray(currentIndexHtmlTags) && currentIndexHtmlTags.length) {
                        console.log(
                            "There are existing tag / URL links to be deleted...",
                            currentIndexHtmlTags
                        );
                        const batch = context.db.batch();

                        for (let k = 0; k < currentIndexHtmlTags.length; k++) {
                            const tag = currentIndexHtmlTags[k];
                            const [PK, SK] = getTagUrlLinkPKSK({ tag, url, dbNamespace });
                            if (PK && SK) {
                                batch.delete({ query: { PK, SK } });
                            }
                        }

                        await batch.execute();
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
                    const batch = context.db.batch();

                    for (let k = 0; k < newIndexHtmlTags.length; k++) {
                        const tag = newIndexHtmlTags[k];
                        const [PK, SK] = getTagUrlLinkPKSK({ tag, url, dbNamespace });
                        if (PK && SK) {
                            const data: DbTagUrlLink = {
                                PK,
                                SK,
                                TYPE: TYPE.DbTagUrlLink,
                                url,
                                key: tag.key,
                                value: tag.value
                            };

                            batch.create({
                                ...defaults.db,
                                data
                            });
                        }
                    }

                    await batch.execute();
                    console.log("New tag / URL links saved.");
                } else {
                    console.log("There are no new tag / URL links to save.");
                }

                for (let j = 0; j < handlerHookPlugins.length; j++) {
                    const plugin = handlerHookPlugins[j];
                    if (typeof plugin.afterRender === "function") {
                        await plugin.afterRender({
                            context,
                            configuration,
                            args
                        });
                    }
                }
            }

            return { data: null, error: null };
        } catch (e) {
            console.log("An error occurred while prerendering...", e);
            console.log(JSON.stringify(e.message));
            return { data: null, error: e };
        }
    }
});
