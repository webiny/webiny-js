import { HandlerContextPlugin } from "@webiny/handler/types";

export default [
    {
        type: "context",
        name: "context-files",
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
    } as HandlerContextPlugin
];
