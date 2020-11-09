import { ErrorResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

export const install: GraphQLFieldResolver = async (root, args, context) => {
    const formBuilderSettings = context?.formBuilder?.crud?.formBuilderSettings;

    try {
        const existingSettings = await formBuilderSettings.get();
        if (existingSettings?.installed) {
            return new ErrorResponse({
                code: "FORM_BUILDER_INSTALL_ABORTED",
                message: "Form builder is already installed."
            });
        }
        // Prepare "settings" data
        const data: any = {};
        if (args.domain) {
            data.domain = args.domain;
        }
        data.installed = true;

        if (!existingSettings) {
            // Create a new settings
            await formBuilderSettings.create(data);
        } else {
            // Update existing one
            await formBuilderSettings.update({ data, existingSettings });
        }

        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: "FORM_BUILDER_ERROR",
            message: e.message,
            data: e.data
        });
    }
};

export const isInstalled: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const formBuilderSettings = context?.formBuilder?.crud?.formBuilderSettings;
        const settings = await formBuilderSettings.get();
        return new Response(Boolean(settings?.installed));
    } catch (e) {
        return new ErrorResponse({
            code: "FORM_BUILDER_ERROR",
            message: e.message,
            data: e.data
        });
    }
};
