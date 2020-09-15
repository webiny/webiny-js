type FileType = {
    id?: string;
    key?: string;
};

type FileWithSrcType = FileType & { src: string };

type FileDbType = {
    __type: "file";
    id: string;
    key: string;
};

const createFileValue = async (context, file?: FileType): Promise<FileWithSrcType> => {
    const { srcPrefix } = await context.settingsManager.getSettings("file-manager");
    return {
        ...file,
        src: `${srcPrefix}${file.key}`
    };
};

const createFileForDatabase = (file?: FileType): FileDbType => {
    if (!file || !file.id || !file.key) {
        throw new Error("Missing file information in the elements data.image path.");
    }
    return {
        __type: "file",
        id: file.id,
        key: file.key
    };
};

export default [
    {
        name: "cms-element-modifier-background-image",
        type: "pb-page-element-modifier",
        elementType: "*",
        getStorageValue({ element }) {
            const file = element?.data?.settings?.background?.image?.file;
            element.data.settings.background.image.file = createFileForDatabase(file);
        },
        async setStorageValue({ element, context }) {
            const file = element?.data?.settings?.background?.image?.file;
            if (!file) {
                return;
            }
            element.data.settings.background.image.file = await createFileValue(context, file);
        }
    },
    {
        name: "cms-element-modifier-image",
        type: "pb-page-element-modifier",
        elementType: "image",
        getStorageValue({ element }) {
            const file = element?.data?.image?.file;
            element.data.image.file = createFileForDatabase(file);
        },
        async setStorageValue({ element, context }) {
            const file = element?.data?.image?.file;
            if (!file) {
                return;
            }
            element.data.image.file = await createFileValue(context, file);
        }
    }
];
