import type { ImagePayload } from "~/commands/index.js";

export interface FileManagerFileItem {
    id: string;
    src: string;
    name: string;
    type: string; // MIME type
    size: number; // bytes
    // Required for images (apps depend on these for Next.js Image, etc.)
    width?: number;
    height?: number;
}

export const fileToImagePayload = (file: FileManagerFileItem): ImagePayload | null => {
    const imagePayload = {} as ImagePayload;
    imagePayload["id"] = file.id;
    imagePayload["src"] = file.src;
    imagePayload["altText"] = file.name;
    imagePayload["width"] = file.width;
    imagePayload["height"] = file.height;

    return imagePayload;
};
