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

 export const fileToImagePayload = (file: FileManagerFileItem): ImagePayload | null => {
    const imagePayload = {} as ImagePayload;
    imagePayload["id"] = file.id;
    imagePayload["src"] = file.src;
    imagePayload["showCaption"] = true;
    imagePayload["captionsEnabled"] = true;

    if (file?.meta) {
        for (const metaValue of file.meta) {
            if (metaValue.key === "name") {
                imagePayload["altText"] = metaValue.value;
            } else if (metaValue.key === "width") {
                imagePayload["width"] = metaValue.value;
            } else if (metaValue.key === "height") {
                imagePayload["height"] = metaValue.value;
            }
        }
    }

    return imagePayload;
};
