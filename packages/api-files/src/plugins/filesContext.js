// @flow
import type { ApiContext, PluginType } from "@webiny/api/types";

export default ([
    {
        type: "graphql-context",
        name: "graphql-context-files",
        apply: async (context: ApiContext & Object) => {
            const { FilesSettings } = context.models;

            const self = {
                __files: {
                    settings: await FilesSettings.load(),
                },
                getSettings() {
                    return self.__files.settings;
                },
            };

            context.files = self;
        }
    }
]: Array<PluginType>);
