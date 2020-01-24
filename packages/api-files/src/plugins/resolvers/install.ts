import { ErrorResponse, Response } from "@webiny/api";
import { GraphQLFieldResolver } from "@webiny/api/types";

export const install: GraphQLFieldResolver = async (root, args, context) => {
    // Start the download of initial Page Builder page / block images.
    const { FilesSettings } = context.models;

    try {
        const settings = await FilesSettings.load();
        if (await settings.data.installed) {
            return new ErrorResponse({
                code: "FILES_INSTALL_ABORTED",
                message: "File Manager is already installed."
            });
        }

        if (args.srcPrefix) {
            settings.data.srcPrefix = args.srcPrefix;
        }
        settings.data.installed = true;
        await settings.save();
        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: "FILES_INSTALL_ERROR",
            message: e.message
        });
    }
};

export const isInstalled: GraphQLFieldResolver = async (root, args, context) => {
    const { FilesSettings } = context.models;
    const settings = await FilesSettings.load();
    return new Response(settings.data.installed);
};
