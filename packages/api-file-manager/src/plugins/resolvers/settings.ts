import { ErrorResponse, Response } from "@webiny/graphql/responses";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SETTINGS_KEY } from "@webiny/api-file-manager/plugins/crud/filesSettings.crud";

export const getSettings: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const data = await context.filesSettings.get(SETTINGS_KEY);
        return new Response(data);
    } catch (e) {
        return new ErrorResponse({
            code: e.code || "GET_FILE_SETTINGS_ERROR",
            message: e.message,
            data: e.data
        });
    }
};

export const updateSettings: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const { data } = args;
        const existingSettings = await context.filesSettings.get(SETTINGS_KEY);
        const updatedSettings = await context.filesSettings.update({
            data: { ...data, key: SETTINGS_KEY },
            existingSettings
        });
        return new Response(updatedSettings);
    } catch (e) {
        return new ErrorResponse({
            code: e.code || "UPDATE_FILE_SETTINGS_ERROR",
            message: e.message,
            data: e.data
        });
    }
};
