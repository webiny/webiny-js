import type { ExifTags } from "exifreader";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { MetadataReader } from "../WriteFileMetadata/MetadataReader.js";

export interface ExtractMetadataInput {
    fileId: string;
}

class ExtractMetadataTask implements TaskDefinition.Interface<ExtractMetadataInput> {
    id = "fileManagerExtractMetadata";
    title = "Extract image metadata (dimensions, EXIF, IPTC)";
    description = "A task to extract metadata from uploaded image files";
    maxIterations = 1;
    isPrivate = true;
    enableDatabaseLogs = false;

    constructor(
        private keyValueStore: GlobalKeyValueStore.Interface,
        private updateFileUseCase: UpdateFileUseCase.Interface
    ) {}

    public async run({
        input,
        controller
    }: TaskDefinition.RunParams<ExtractMetadataInput>): Promise<
        TaskDefinition.Result<ExtractMetadataInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        // Load file metadata
        const metadataReader = new MetadataReader(this.keyValueStore);
        const fileMetadata = await metadataReader.read(input.fileId);

        if (!fileMetadata) {
            return controller.response.error({
                message: `File metadata not found for file ID: ${input.fileId}`
            });
        }

        // Check if it's an image file
        if (!fileMetadata.contentType.startsWith("image/")) {
            return controller.response.done();
        }

        // Fetch the image from S3
        const s3 = new S3();
        const bucket = String(process.env.S3_BUCKET);

        try {
            const s3Object = await s3.getObject({
                Bucket: bucket,
                Key: fileMetadata.bucketKey
            });

            if (!s3Object.Body) {
                return controller.response.error({
                    message: `S3 object body is empty for file: ${input.fileId}`
                });
            }

            const sharp = await import(/* webpackChunkName: "sharp" */ "sharp").then(
                m => m.default
            );

            const ExifReader = await import(/* webpackChunkName: "exifreader" */ "exifreader").then(
                m => m.default
            );

            // Convert S3 body to buffer
            const buffer = Buffer.from(await s3Object.Body.transformToByteArray());

            // Extract metadata using Sharp for image dimensions
            const sharpInstance = sharp(buffer);
            const sharpMetadata = await sharpInstance.metadata();

            // Use ExifReader to extract EXIF and IPTC data
            const tags = ExifReader.load(buffer, { expanded: true });

            // Build metadata object
            const metadata: Record<string, any> = {
                image: {
                    width: sharpMetadata.width,
                    height: sharpMetadata.height,
                    format: sharpMetadata.format,
                    orientation: sharpMetadata.orientation ?? 1
                }
            };

            // Extract EXIF data if available
            if (tags.exif) {
                metadata.exif = this.cleanValues(tags.exif);
            }

            // Extract IPTC data if available
            if (tags.iptc) {
                metadata.iptc = this.cleanValues(tags.iptc);
            }

            // Update the file with extracted metadata
            const updateResult = await this.updateFileUseCase.execute({
                id: input.fileId,
                metadata
            });

            if (updateResult.isFail()) {
                return controller.response.error({
                    message: `Failed to update file with metadata: ${updateResult.error.message}`
                });
            }

            return controller.response.done();
        } catch (error) {
            return controller.response.error({
                message: `Failed to extract metadata: ${
                    error instanceof Error ? error.message : String(error)
                }`
            });
        }
    }

    private cleanValues(tags: ExifTags) {
        const cleaned: Record<string, any> = {};

        for (const [key, tag] of Object.entries(tags)) {
            if (!tag || typeof tag !== "object") {
                continue;
            }

            // Use description if available, otherwise value
            if (tag.description !== undefined && tag.description !== null) {
                cleaned[key] = tag.description;
            } else if (Array.isArray(tag.value) && tag.value.length > 20) {
                // Skip large byte arrays
            } else if (tag.value !== undefined) {
                cleaned[key] = tag.value;
            }
        }

        return cleaned;
    }
}

export const ExtractMetadataTaskDefinition = TaskDefinition.createImplementation({
    implementation: ExtractMetadataTask,
    dependencies: [GlobalKeyValueStore, UpdateFileUseCase]
});
