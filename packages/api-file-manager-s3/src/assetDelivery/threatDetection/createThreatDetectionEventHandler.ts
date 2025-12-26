import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { createEventBridgeEventHandler } from "@webiny/handler-aws";
import { createHandlerOnRequest } from "@webiny/handler";
import type { GuardDutyEvent } from "./types.js";
import { processThreatScanResult } from "./processThreatScanResult.js";
import { S3AssetMetadataReader } from "~/assetDelivery/s3/S3AssetMetadataReader.js";
import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

const detailType = "GuardDuty Malware Protection Object Scan Result";

const bucket = process.env.S3_BUCKET as string;
const region = process.env.AWS_REGION as string;

export const createThreatDetectionEventHandler = () => {
    const s3 = new S3({ region });

    const handlerOnRequest = createHandlerOnRequest(async request => {
        const payload = request.body as EventBridgeEvent<string, GuardDutyEvent>;

        if (payload["detail-type"] !== detailType) {
            return;
        }

        const objectKey = payload.detail.s3ObjectDetails.objectKey;
        if (objectKey.endsWith(".metadata")) {
            return;
        }

        try {
            const s3Metadata = new S3AssetMetadataReader(s3, bucket);
            const metadata = await s3Metadata.getMetadata(payload.detail.s3ObjectDetails.objectKey);

            request.headers = {
                ...request.headers,
                "x-tenant": metadata.tenant
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
