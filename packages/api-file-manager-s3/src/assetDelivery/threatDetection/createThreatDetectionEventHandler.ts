import { createEventBridgeEventHandler } from "@webiny/handler-aws";
import { createHandlerOnRequest } from "@webiny/handler";
import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import type { GuardDutyEvent } from "./types.js";
import { processThreatScanResult } from "./processThreatScanResult.js";
import { ObjectKey } from "./ObjectKey.js";

const detailType = "GuardDuty Malware Protection Object Scan Result";

export const createThreatDetectionEventHandler = () => {
    const handlerOnRequest = createHandlerOnRequest(async (request, _, context) => {
        const payload = request.body as EventBridgeEvent<string, GuardDutyEvent>;

        if (payload["detail-type"] !== detailType) {
            return;
        }

        const objectKey = payload.detail.s3ObjectDetails.objectKey;
        const keyValueStore = context.container.resolve(GlobalKeyValueStore);

        try {
            // Extract file id from the absolute S3 object key
            const fileId = ObjectKey.from(objectKey).id();
            const result = await keyValueStore.get<{ tenant: string }>(
                `FileManager/File/${fileId}/Metadata`
            );

            if (result.isFail()) {
                return;
            }

            request.headers = {
                ...request.headers,
                "x-tenant": result.value.tenant
            };
        } catch {
            // If metadata can't be loaded, we ignore the file.
            // Most likely it's because the file is a rendition of the original file,
            // so we don't need to do anything with it.
        }
    });
    // Guard Duty event handler.
    const threatScanEventHandler = createEventBridgeEventHandler<typeof detailType, GuardDutyEvent>(
        async ({ payload, next, ...rest }) => {
            const context = rest.context as ApiCoreContext;

            const threatDetectionEnabled = context.wcp.canUseFileManagerThreatDetection();

            if (!threatDetectionEnabled || payload["detail-type"] !== detailType) {
                return next();
            }

            await processThreatScanResult(context, payload.detail);
        }
    );

    // Assign a human-readable name for easier debugging.
    threatScanEventHandler.name = threatScanEventHandler.type + ".threatDetectionEventHandler";

    return [handlerOnRequest, threatScanEventHandler];
};
