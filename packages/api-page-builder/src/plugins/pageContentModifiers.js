import { set, get } from "lodash";

// TODO: Do not read the database directly. Do it via GraphQL.
const getFileById = async ({ id, context }) => {
    // Rethink this part, get files via GraphQL directly, but via a single-gql-call-fetch-everything.
    const { getDatabase } = context;

    try {
        if (!context.files) {
            // eslint-disable-next-line
            context.files = {
                settings: await getDatabase()
                    .collection("Settings")
                    .findOne({ key: "file-manager", deleted: { $ne: true } })
            };
        }

        const result = await getDatabase()
            .collection("File")
            .findOne({ id, deleted: { $ne: true } });

        if (!result) {
            return null;
        }

        return {
            id: result.id,
            src: get(context, "files.settings.data.srcPrefix") + result.key
        };
    } catch (e) {
        return null;
    }
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
