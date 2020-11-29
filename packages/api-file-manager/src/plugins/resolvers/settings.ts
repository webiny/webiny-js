import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { FileManagerResolverContext } from "../../types";

type FileManagerResolver = GraphQLFieldResolver<any, any, FileManagerResolverContext>;

export const getSettings: FileManagerResolver = async (root, args, context) => {
    try {
        const data = await context.fileManager.fileManagerSettings.getSettings();
        return new Response(data);
    } catch (e) {
        return new ErrorResponse({
            code: e.code || "GET_FILE_SETTINGS_ERROR",
            message: e.message,
            data: e.data
        });
    }
};

export const updateSettings: FileManagerResolver = async (root, args, context) => {
    const { fileManagerSettings } = context.fileManager;
    try {
        const { data } = args;
        const existingSettings = await fileManagerSettings.getSettings();
        const updatedSettings = await fileManagerSettings.updateSettings(data);
        return new Response({ ...existingSettings, ...updatedSettings });
    } catch (e) {
        return new ErrorResponse({
            code: e.code || "UPDATE_FILE_SETTINGS_ERROR",
            message: e.message,
            data: e.data
        });
    }
};
