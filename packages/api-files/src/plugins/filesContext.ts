import { PluginType } from "@webiny/api/types";

const plugins: PluginType[] = [
    {
        type: "graphql-context",
        name: "graphql-context-files",
        apply: async (context: Record<string, any>): Promise<any> => {
            const { FilesSettings } = context.models;

            const self = {
                __files: {
                    settings: await FilesSettings.load()
                },
                getSettings() {
                    return self.__files.settings;
                }
            };

            context.files = self;
        }
    }
];

export default plugins;
