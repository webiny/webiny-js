import { ImagePayload } from "~/commands";

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
    imagePayload["id"] = file.id;
    imagePayload["src"] = file.src;
    imagePayload["showCaption"] = true;
    imagePayload["captionsEnabled"] = true;

    for (const metaValue of file.meta) {
        if (metaValue.key === "name") {
            imagePayload["altText"] = metaValue.value;
        } else if (metaValue.key === "width") {
            imagePayload["width"] = metaValue.value;
        } else if (metaValue.key === "height") {
            imagePayload["height"] = metaValue.value;
        }
    }
    return imagePayload;
};
