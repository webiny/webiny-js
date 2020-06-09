import { ErrorResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { resolveUpdateSettings } from '@webiny/commodo-graphql';

export const getSettings: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const data = await context.settingsManager.getSettings("file-manager");
        return {
            data
        };
    } catch (e) {
        return new ErrorResponse({
            code: "GET_FILE_SETTINGS_ERROR",
            message: e.message
        });
    }
};
