import { ImagePayload } from "~/commands/insertFiles";

export interface FileManagerFileItem {
    id: string;
    src: string;
    meta?: Array<FileManagerFileItemMetaItem>;
}

export interface FileManagerFileItemMetaItem {
    key: string;
    value: any;
}

export const isImageType = (file: FileManagerFileItem): boolean => {
    if (!file?.meta) {
        return false;
    }

    for (const metaItem of file.meta) {
        if (metaItem.key === "type") {
            return metaItem.value.includes("image/");
        }
    }

    return false;
};

export const fileToImagePayload = (file: FileManagerFileItem): ImagePayload | null => {
    if (!file?.meta) {
        return null;
    }

    if (!isImageType(file)) {
        return null;
    }

    const imagePayload = {} as ImagePayload;
    imagePayload["src"] = file.src;
    imagePayload["showCaption"] = false;
    imagePayload["captionsEnabled"] = false;

    for (const metaValue of file.meta) {
        if (metaValue.key === "name") {
            imagePayload["altText"] = metaValue.value;
        }
    }

    return imagePayload;
};
