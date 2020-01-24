import { set, get } from "lodash";

const getGetFileResolverPlugin = context => {
    const plugin = context.plugins.byName("pb-resolver-get-page-content-file");
    if (!plugin) {
        throw Error(`Resolver plugin "pb-resolver-get-page-content-file" is not configured!`);
    }
    return plugin;
};

export default ({ database }) => {
    return [
        {
            name: "cms-element-modifier-background-image",
            type: "pb-page-element-modifier",
            elementType: "*",
            getStorageValue({ element }) {
                const file = get(element, "data.settings.background.image.file.id");
                if (file) {
                    set(element, "data.settings.background.image.file", file);
                }
            },
            async setStorageValue({ element, context }) {
                const id = get(element, "data.settings.background.image.file");
                if (id) {
                    const plugin = getGetFileResolverPlugin(context);
                    const file = await plugin.resolve({ context, id, database });
                    if (file) {
                        set(element, "data.settings.background.image.file", file);
                    }
                }
            }
        },
        {
            name: "cms-element-modifier-image",
            type: "pb-page-element-modifier",
            elementType: "image",
            getStorageValue({ element }) {
                const file = get(element, "data.image.file.id");
                if (file) {
                    set(element, "data.image.file", file);
                }
            },
            async setStorageValue({ element, context }) {
                const id = get(element, "data.image.file");
                if (id) {
                    const plugin = getGetFileResolverPlugin(context);
                    const file = await plugin.resolve({ context, id, database });
                    if (file) {
                        set(element, "data.image.file", file);
                    }
                }
            }
        }
    ];
};
