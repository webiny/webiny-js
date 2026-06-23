import type { ExifTags } from "exifreader";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { MetadataReader } from "@webiny/api-file-manager/features/upload/WriteFileMetadata/MetadataReader.js";
import type { ExtractMetadataInput } from "@webiny/api-file-manager/features/extractMetadata/ExtractMetadataInput.js";

class ExtractMetadataTaskImpl implements TaskDefinition.Interface<ExtractMetadataInput> {
    public readonly id = "fileManagerExtractMetadata";
    public readonly title = "Extract image metadata (dimensions, EXIF, IPTC)";
    public readonly description = "A task to extract metadata from uploaded image files";
    public readonly maxIterations = 1;
    public readonly isPrivate = true;
    public readonly databaseLogs = false;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    constructor(
        private readonly keyValueStore: GlobalKeyValueStore.Interface,
        private readonly updateFileUseCase: UpdateFileUseCase.Interface
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

        /* Load file metadata from the key-value store. */
        const metadataReader = new MetadataReader(this.keyValueStore);
        const fileMetadata = await metadataReader.read(input.fileId);

        if (!fileMetadata) {
            return controller.response.error({
                message: `File metadata not found for file ID: ${input.fileId}`
            });
        }

        /* Only process image files. */
        if (!fileMetadata.contentType.startsWith("image/")) {
            return controller.response.done();
        }

        /* Fetch the image from S3. */
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

            /* Convert S3 body to buffer. */
            const buffer = Buffer.from(await s3Object.Body.transformToByteArray());

            const sharp = await import(/* webpackChunkName: "sharp" */ "sharp").then(
                m => m.default
            );

            const ExifReader = await import(/* webpackChunkName: "exifreader" */ "exifreader").then(
                m => m.default
            );

            /* Extract image dimensions using Sharp. */
            const sharpInstance = sharp(buffer);
            const sharpMetadata = await sharpInstance.metadata();

            /* Use ExifReader to extract EXIF and IPTC data. */
            const tags = ExifReader.load(buffer, { expanded: true });

            /* Build metadata object. */
            const metadata: Record<string, unknown> = {
                image: {
                    width: sharpMetadata.width,
                    height: sharpMetadata.height,
                    format: sharpMetadata.format,
                    orientation: sharpMetadata.orientation ?? 1
                }
            };

            if (tags.exif) {
                metadata.exif = this.cleanValues(tags.exif);
            }

            if (tags.iptc) {
                metadata.iptc = this.cleanValues(tags.iptc);
            }
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
        const cleaned: Record<string, unknown> = {};

        for (const [key, tag] of Object.entries(tags)) {
            if (!tag || typeof tag !== "object") {
                continue;
            }

            /* Use description if available, otherwise value. */
            if (tag.description !== undefined && tag.description !== null) {
                cleaned[key] = tag.description;
            } else if (Array.isArray(tag.value) && tag.value.length > 20) {
                /* Skip large byte arrays. */
            } else if (tag.value !== undefined) {
                cleaned[key] = tag.value;
            }
        }

        return cleaned;
    }
}

export const ExtractMetadataTaskDefinition = TaskDefinition.createImplementation({
    implementation: ExtractMetadataTaskImpl,
    dependencies: [GlobalKeyValueStore, UpdateFileUseCase]
});
