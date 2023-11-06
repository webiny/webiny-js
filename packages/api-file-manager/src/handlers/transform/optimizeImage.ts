/**
 * Sharp is included in the AWS Lambda layer
 */
import sharp from "sharp";
import type { Readable } from "stream";

export default async (stream: Readable, type: string): Promise<Buffer> => {
    switch (type) {
        case "image/png": {
            const optimizedImage = sharp()
                .resize({ width: 2560, withoutEnlargement: true, fit: "inside" })
                .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
                .withMetadata();

            return await stream.pipe(optimizedImage).toBuffer();
        }
        case "image/jpeg":
        case "image/jpg": {
            const optimizedImage = sharp()
                .resize({ width: 2560, withoutEnlargement: true, fit: "inside" })
                .toFormat("jpeg", { quality: 90 });

            return await stream.pipe(optimizedImage).toBuffer();
        }
        default:
            const chunks = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            return Buffer.concat(chunks);
    }
};
