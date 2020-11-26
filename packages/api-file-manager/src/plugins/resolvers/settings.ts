import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { FileManagerResolverContext } from "../../types";

export const getSettings: GraphQLFieldResolver = async (
    root,
    args,
    context: FileManagerResolverContext
) => {
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

export const updateSettings: GraphQLFieldResolver = async (
    root,
    args,
    context: FileManagerResolverContext
) => {
    try {
        const { data } = args;
        const existingSettings = await context.fileManager.fileManagerSettings.getSettings();
        const updatedSettings = await context.fileManager.fileManagerSettings.updateSettings(data);
        return new Response({ ...existingSettings, ...updatedSettings });
    } catch (e) {
        return new ErrorResponse({
            code: e.code || "UPDATE_FILE_SETTINGS_ERROR",
            message: e.message,
            data: e.data
        });
    }
};
