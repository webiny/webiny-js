import { ErrorResponse, Response } from "@webiny/api";

export const install = async (root: any, args: Object, context: Object) => {
    const { FormSettings } = context.models;

    try {
        let settings = await FormSettings.load();
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

export const isInstalled = async (root: any, args: Object, context: Object) => {
    const { FormSettings } = context.models;
    const settings = await FormSettings.load();
    return new Response(settings.data.installed);
};
