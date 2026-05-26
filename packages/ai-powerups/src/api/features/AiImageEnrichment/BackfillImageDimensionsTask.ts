import sharp from "sharp";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/index.js";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { GetSettingsUseCase as FmGetSettingsUseCase } from "@webiny/api-file-manager/features/settings/GetSettings/abstractions.js";

export const BACKFILL_IMAGE_DIMENSIONS_TASK_ID = "fmBackfillImageDimensions";

const PAGE_SIZE = 50;

export interface IBackfillImageDimensionsTaskInput {
    /** When true, process all images even if dimensions are already set. */
    force?: boolean;
}

interface BackfillStats {
    scanned: number;
    updated: number;
    skipped: number;
    failed: number;
}

class BackfillImageDimensionsTaskImpl
    implements TaskDefinition.Interface<IBackfillImageDimensionsTaskInput>
{
    id = BACKFILL_IMAGE_DIMENSIONS_TASK_ID;
    title = "File Manager - Backfill Image Dimensions";
    description =
        "Walks all image files and writes width/height/format into metadata.image when missing.";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = true;

    constructor(
        private listFiles: ListFilesUseCase.Interface,
        private updateFile: UpdateFileUseCase.Interface,
        private fmSettings: FmGetSettingsUseCase.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IBackfillImageDimensionsTaskInput>): Promise<
        TaskDefinition.Result<IBackfillImageDimensionsTaskInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const settingsResult = await this.fmSettings.execute();
        const srcPrefix = settingsResult.isOk() ? (settingsResult.value.srcPrefix ?? "") : "";

        const stats: BackfillStats = { scanned: 0, updated: 0, skipped: 0, failed: 0 };
        let cursor: string | null = null;
        const force = input.force === true;

        do {
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            }

            const listResult = await this.listFiles.execute({
                where: { type_startsWith: "image/" },
                limit: PAGE_SIZE,
                after: cursor
            });

            if (listResult.isFail()) {
                return controller.response.error({
                    message: `Failed to list files: ${listResult.error.message}`
                });
            }

            const { items, meta: pageMeta } = listResult.value;

            for (const file of items) {
                stats.scanned++;

                const existing = file.metadata?.image as
                    | { width?: number; height?: number }
                    | undefined;
                if (!force && existing?.width && existing?.height) {
                    stats.skipped++;
                    continue;
                }

                try {
                    const imageUrl = `${srcPrefix}${file.key}`;
                    const response = await fetch(imageUrl);
                    if (!response.ok) {
                        stats.failed++;
                        continue;
                    }
                    const buffer = Buffer.from(await response.arrayBuffer());
                    const imageMeta = await sharp(buffer).metadata();

                    if (!imageMeta.width || !imageMeta.height) {
                        stats.failed++;
                        continue;
                    }

                    const updateResult = await this.updateFile.execute({
                        id: file.id,
                        metadata: {
                            ...(file.metadata || {}),
                            image: {
                                ...(file.metadata?.image || {}),
                                width: imageMeta.width,
                                height: imageMeta.height,
                                format: imageMeta.format
                            }
                        }
                    });

                    if (updateResult.isFail()) {
                        stats.failed++;
                    } else {
                        stats.updated++;
                    }
                } catch {
                    stats.failed++;
                }
            }

            cursor = pageMeta.hasMoreItems ? pageMeta.cursor : null;
        } while (cursor);

        return controller.response.done(
            `Backfill complete. Scanned: ${stats.scanned}, updated: ${stats.updated}, skipped: ${stats.skipped}, failed: ${stats.failed}.`
        );
    }
}

export const BackfillImageDimensionsTask = TaskDefinition.createImplementation({
    implementation: BackfillImageDimensionsTaskImpl,
    dependencies: [ListFilesUseCase, UpdateFileUseCase, FmGetSettingsUseCase]
});