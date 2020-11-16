import { ErrorResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { FormBuilderSettingsCRUD } from "../../types";

export const install: GraphQLFieldResolver = async (root, args, context) => {
    const formBuilderSettings: FormBuilderSettingsCRUD =
        context?.formBuilder?.crud?.formBuilderSettings;

    try {
        const existingSettings = await formBuilderSettings.getSettings();
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
            await formBuilderSettings.createSettings(data);
        } else {
            // Update existing one
            await formBuilderSettings.updateSettings(data);
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
        const formBuilderSettings: FormBuilderSettingsCRUD =
            context?.formBuilder?.crud?.formBuilderSettings;

        const settings = await formBuilderSettings.getSettings();
        return new Response(Boolean(settings?.installed));
    } catch (e) {
        return new ErrorResponse({
            code: "FORM_BUILDER_ERROR",
            message: e.message,
            data: e.data
        });
    }
};
