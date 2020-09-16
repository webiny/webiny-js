type File = {
    id?: string;
    key?: string;
};

type FileWithSrc = File & { src: string };

type FileDb = {
    __type: "file";
    id: string;
    key: string;
};

const createFileFromStorage = async (context, file?: File): Promise<FileWithSrc> => {
    if (!file || !file.key) {
        return null;
    }
    try {
        const { srcPrefix } = await context.settingsManager.getSettings("file-manager");
        return {
            ...file,
            src: `${srcPrefix}${file.key}`
        };
    } catch (ex) {
        return null;
    }
};

const createFileForStorage = (file?: File): FileDb => {
    if (!file || !file.id || !file.key) {
        return null;
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
            const file = createFileForStorage(element?.data?.settings?.background?.image?.file);
            if (!file) {
                return;
            }
            element.data.settings.background.image.file = file;
        },
        async setStorageValue({ element, context }) {
            const file = await createFileFromStorage(
                context,
                element?.data?.settings?.background?.image?.file
            );
            if (!file) {
                return;
            }
            element.data.settings.background.image.file = file;
        }
    },
    {
        name: "cms-element-modifier-image",
        type: "pb-page-element-modifier",
        elementType: "image",
        getStorageValue({ element }) {
            const file = element?.data?.image?.file;
            if (!file) {
                return;
            }
            element.data.image.file = createFileForStorage(file);
        },
        async setStorageValue({ element, context }) {
            const file = await createFileFromStorage(context, element?.data?.image?.file);
            if (!file) {
                return;
            }
            element.data.image.file = file;
        }
    }
];
