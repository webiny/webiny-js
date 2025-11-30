import type { GuardDutyEvent, ThreatDetectionContext } from "./types.js";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/index.js";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { DeleteFileUseCase } from "@webiny/api-file-manager/features/file/DeleteFile/index.js";
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";

export const processThreatScanResult = async (
    context: ThreatDetectionContext,
    eventDetail: GuardDutyEvent
) => {
    const websocketService = context.container.resolve(WebsocketService);
    const listFiles = context.container.resolve(ListFilesUseCase);
    const updateFile = context.container.resolve(UpdateFileUseCase);
    const deleteFile = context.container.resolve(DeleteFileUseCase);

    await context.security.withoutAuthorization(async () => {
        try {
            const scanStatus = eventDetail.scanResultDetails.scanResultStatus;
            const s3Object = eventDetail.s3ObjectDetails;

            const listResult = await listFiles.execute({
                limit: 1,
                where: {
                    key: s3Object.objectKey
                }
            });

            const [file] = listResult.value.items;

            if (!file) {
                return;
            }

            const allConnections = await websocketService.listConnections();

            if (scanStatus === "NO_THREATS_FOUND") {
                const newTags = file.tags.filter(tag => tag !== "threatScanInProgress");
                await updateFile.execute({
                    id: file.id,
                    tags: newTags
                });

                await websocketService.sendToConnections(allConnections, {
                    action: "fm.threatScan.noThreatFound",
                    data: {
                        id: file.id,
                        tags: newTags
                    }
                });

                return;
            }

            if (scanStatus === "THREATS_FOUND") {
                // Delete infected file.
                await deleteFile.execute(file.id);

                await websocketService.sendToConnections(allConnections, {
                    action: "fm.threatScan.threatDetected",
                    data: {
                        id: file.id,
                        name: file.name
                    }
                });

                return;
            }

            // For all other outcomes, we delete the file, until better logic is implemented.
            await deleteFile.execute(file.id);

            await websocketService.sendToConnections(allConnections, {
                action: "fm.threatScan.unsupported",
                data: {
                    id: file.id,
                    name: file.name
                }
            });
        } catch (e) {
            console.log(e.message);
        }
    });
};
