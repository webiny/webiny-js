import { ErrorResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SETTINGS_KEY } from "@webiny/api-file-manager/plugins/crud/filesSettings.crud";

export const install: GraphQLFieldResolver = async (root, args, context) => {
    // Start the download of initial Page Builder page / block images.
    const { filesSettings } = context;

    try {
        let settings = await filesSettings.get(SETTINGS_KEY);

        if (!settings) {
            settings = await filesSettings.create();
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

        await filesSettings.update({ data: {}, existingSettings: settings });
        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: e.code || "FILES_INSTALL_ERROR",
            message: e.message,
            data: e.data
        });
    }
};

export const isInstalled: GraphQLFieldResolver = async (root, args, context) => {
    const { filesSettings } = context;
    const settings = await filesSettings.get(SETTINGS_KEY);
    return new Response(Boolean(settings?.installed));
};
