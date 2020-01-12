import { GraphQLContextPlugin } from "@webiny/api/types";

export default [
    {
        type: "graphql-context",
        name: "graphql-context-files",
        apply: async (context): Promise<any> => {
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
    } as GraphQLContextPlugin
];
