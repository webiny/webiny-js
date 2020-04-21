import { GraphQLContextPlugin } from "@webiny/graphql/types";

export default [
    {
        type: "graphql-context",
        name: "graphql-context-files",
        async apply(context) {
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
