import { set, get } from "lodash";

const getFileById = async ({ id, context }) => {
    // Rethink this part, get files via GraphQL directly, but via a single-gql-call-fetch-everything.
    const { getDatabase } = context;
    const searchResults = await getDatabase()
        .collection("File")
        .find({ id, deleted: { $ne: true } })
        .project({ _id: 0, id: 1, src: 1 })
        .toArray();

    if (!Array.isArray(searchResults)) {
        return null;
    }

    return searchResults[0] || null;
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
                const file = await getFileById({ context, id });
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
                const file = await getFileById({ context, id });
                if (file) {
                    set(element, "data.image.file", file);
                }
            }
        }
    }
];
