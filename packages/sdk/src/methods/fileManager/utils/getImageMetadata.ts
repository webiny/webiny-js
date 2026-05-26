import { isBrowser } from "../../../utils/platform.js";
import { isFile, isBlob } from "./fileTypeDetection.js";

interface ImageMetadata {
    image: {
        width: number;
        height: number;
    };
}

export async function getImageMetadata(
    file: Buffer | Blob | File
): Promise<ImageMetadata | undefined> {
    if (!isBrowser) {
        return undefined;
    }

    if (!isFile(file) && !isBlob(file)) {
        return undefined;
    }

    try {
        const bitmap = await createImageBitmap(file);
        const metadata: ImageMetadata = {
            image: {
                width: bitmap.width,
                height: bitmap.height
            }
        };
        bitmap.close();
        return metadata;
    } catch {
        return undefined;
    }
}
