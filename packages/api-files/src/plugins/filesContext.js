// @flow
import type { Object } from "@webiny/api/types";
import { PluginType } from "@webiny/plugins/types";

export default ([
    {
        type: "graphql-context",
        name: "graphql-context-files",
        apply: async (context: Object) => {
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
]: Array<PluginType>);
