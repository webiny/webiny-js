import { set, get } from "lodash";

const getFileById = async ({ id, context: { getEntity } }) => {
    const file = await getEntity("File").findById(id);
    if (file) {
        return { id: file.id, src: file.src };
    }
};

export default [
    {
        name: "cms-element-modifier-background-image",
        type: "cms-element-modifier",
        element: "*",
        getStorageValue({ element }) {
            const file = get(element, "data.settings.background.image.file.id");
            if (file) {
                set(element, "data.settings.background.image.file", file);
            }
        },
        async setStorageValue({ element, context }) {
            const id = get(element, "data.settings.background.image.file");
            if (id) {
                const file = await getFileById({ context, id });
                if (file) {
                    set(element, "data.settings.background.image.file", file);
                }
            }
        }
    },
    {
        name: "cms-element-modifier-image",
        type: "cms-element-modifier",
        element: "cms-element-image",
        getStorageValue({ element }) {
            const file = get(element, "data.image.file.id");
            if (file) {
                set(element, "data.image.file", file);
            }
        },
        async setStorageValue({ element, context }) {
            const id = get(element, "data.image.file");
            if (id) {
                const file = await getFileById({ context, id });
                if (file) {
                    set(element, "data.image.file", file);
                }
            }
        }
    }
];
