import { ContextPlugin } from "@webiny/graphql/types";
import { ContextFilesGetSettings } from "@webiny/api-files/types";

const plugin: ContextPlugin = {
    type: "context",
    name: "context-files",
    apply: async context => {
        const fileSettings = context.plugins.byName<ContextFilesGetSettings>(
            "context-files-get-settings"
        );

        if (!fileSettings) {
            throw new Error(
                'Cannot load fileSettings - missing "context-i18n-get-fileSettings" plugin.'
            );
        }

        const self = {
            __files: {
                filesSettings: await fileSettings.resolve({ context })
            },
            getFileSettings() {
                return self.__files.filesSettings;
            }
        };

        context.files = self;
    }
};

export default plugin;
