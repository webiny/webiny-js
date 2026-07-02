import { promises as fs } from "node:fs";
import type { ExifTags } from "exifreader";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { MetadataReader } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/abstractions.js";
import type { ExtractMetadataInput } from "@webiny/api-file-manager/features/extractMetadata/ExtractMetadataInput.js";

class ExtractMetadataTaskImpl implements TaskDefinition.Interface<ExtractMetadataInput> {
    public readonly id = "fileManagerExtractMetadata";
    public readonly title = "Extract image metadata (dimensions, EXIF, IPTC)";
    public readonly description = "A task to extract metadata from uploaded image files";
    public readonly maxIterations = 1;
    public readonly isPrivate = true;
    public readonly databaseLogs = false;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    public constructor(
        private readonly metadataReader: MetadataReader.Interface,
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
        const fileMetadata = await this.metadataReader.read(input.fileId);

        if (!fileMetadata) {
            return controller.response.error({
                message: `File metadata not found for file ID: ${input.fileId}`
            });
        }

        /* Only process image files. */
        if (!fileMetadata.contentType.startsWith("image/")) {
            return controller.response.done();
        }

        const storagePath = String(process.env.WEBINY_LOCAL_STORAGE_PATH);
        const filePath = `${storagePath}/${fileMetadata.bucketKey}`;

        try {
            /* Read the image file from local disk. */
            const buffer = await fs.readFile(filePath);

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

            /* Extract EXIF data if available. */
            if (tags.exif) {
                metadata.exif = this.cleanValues(tags.exif);
            }

            /* Extract IPTC data if available. */
            if (tags.iptc) {
                metadata.iptc = this.cleanValues(tags.iptc);
            }

            /* Update the file with extracted metadata. */
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
    dependencies: [MetadataReader, UpdateFileUseCase]
});
