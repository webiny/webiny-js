import { applyContextPlugins } from "@webiny/graphql/createSchema/contextPlugins";
import models from "../plugins/models";

export default () => [
    {
        type: "handler",
        name: "handler-files-settings",
        async handle({ context }) {
            context.plugins.register(models());
            await applyContextPlugins(context);
            const { FilesSettings } = context.models;

            const settings = await FilesSettings.load();
            const installed = await settings.data.installed;
            const srcPrefix = await settings.data.srcPrefix;

            return {
                installed,
                srcPrefix
            };
        }
    }
];
