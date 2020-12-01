import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { FileManagerResolverContext } from "../../types";

export const install: GraphQLFieldResolver = async (
    root,
    args,
    context: FileManagerResolverContext
) => {
    // Start the download of initial Page Builder page / block images.
    const { fileManagerSettings } = context.fileManager;

    try {
        let settings = await fileManagerSettings.getSettings();

        if (!settings) {
            settings = await fileManagerSettings.createSettings({});
        }

        if (settings.installed) {
            return new ErrorResponse({
                code: "FILES_INSTALL_ABORTED",
                message: "File Manager is already installed."
            });
        }

        if (args.srcPrefix) {
            settings.srcPrefix = args.srcPrefix;
        }
        settings.installed = true;

        await fileManagerSettings.updateSettings(settings);
        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: e.code || "FILES_INSTALL_ERROR",
            message: e.message,
            data: e.data
        });
    }
};

export const isInstalled: GraphQLFieldResolver = async (
    root,
    args,
    context: FileManagerResolverContext
) => {
    const { security, fileManager } = context;
    if (!security.getTenant()) {
        return false;
    }

    const settings = await fileManager.fileManagerSettings.getSettings();
    return new Response(Boolean(settings?.installed));
};
