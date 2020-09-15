import { set, get } from "lodash";

const getGetFileResolverPlugin = context => {
    const plugin = context.plugins.byName("pb-resolver-get-page-content-file");
    if (!plugin) {
        throw Error(`Resolver plugin "pb-resolver-get-page-content-file" is not configured!`);
    }
    return plugin;
};

const createImageSrc = async (context, key) => {
    const { srcPrefix } = await context.settingsManager.getSettings("file-manager");

    return `${srcPrefix}${key}`;
};

export default [
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
                const file = await plugin.resolve({ context, id });
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
            const file = element?.data?.image?.file;
            if (!file) {
                throw new Error("Missing file information in the elements data.image path.");
            }
            element.data.image.file = {
                __type: "file",
                id: file.id,
                key: file.key
            };
        },
        async setStorageValue({ element, context }) {
            const file = element?.data?.image?.file;
            if (!file || !file.key) {
                return;
            }
            const src = await createImageSrc(context, file.key);
            element.data.image.file = {
                ...file,
                src
            };
        }
    }
];
