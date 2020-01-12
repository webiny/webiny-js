import { ErrorResponse, Response } from "@webiny/api";
import { GraphQLFieldResolver } from "@webiny/api/types";

export const install: GraphQLFieldResolver = async (root, args, context) => {
    const { FormSettings } = context.models;

    try {
        const settings = await FormSettings.load();
        if (await settings.data.installed) {
            return new ErrorResponse({
                code: "FORM_BUILDER_INSTALL_ABORTED",
                message: "Form builder is already installed."
            });
        }

        if (args.domain) {
            settings.data.domain = args.domain;
        }
        settings.data.installed = true;
        await settings.save();
        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: "FORM_BUILDER_ERROR",
            message: e.message
        });
    }
};

export const isInstalled: GraphQLFieldResolver = async (root, args, context) => {
    const { FormSettings } = context.models;
    const settings = await FormSettings.load();
    return new Response(settings.data.installed);
};
