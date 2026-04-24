import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { DeleteFileUseCase } from "@webiny/api-file-manager/features/file/DeleteFile/index.js";
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";
import type { GuardDutyEvent } from "./types.js";
import { ObjectKey } from "./ObjectKey.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";

export const processThreatScanResult = async (
    context: ApiCoreContext,
    eventDetail: GuardDutyEvent
) => {
    const websocketService = context.container.resolve(WebsocketService);
    const getFile = context.container.resolve(GetFileUseCase);
    const updateFile = context.container.resolve(UpdateFileUseCase);
    const deleteFile = context.container.resolve(DeleteFileUseCase);

    await context.security.withoutAuthorization(async () => {
        const scanStatus = eventDetail.scanResultDetails.scanResultStatus;
        const s3Object = eventDetail.s3ObjectDetails;

        const fileId = ObjectKey.from(s3Object.objectKey).id();
        const fileResult = await getFile.execute(fileId);

        if (fileResult.isFail()) {
            return;
        }

        const file = fileResult.value;

        let allConnections: WebsocketService.Connection[] = [];
        const connectionsResult = await websocketService.listConnections();
        if (connectionsResult.isOk()) {
            allConnections = connectionsResult.value;
        }

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
            // Delete the infected file.
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
    });
};
