import type { Context as IWebsocketsContext } from "@webiny/api-websockets";
import type { FileManagerContext } from "@webiny/api-file-manager/types.js";

export type ThreatDetectionContext = FileManagerContext & IWebsocketsContext;

export type GuardDutyEvent = {
    scanResultDetails: {
        scanResultStatus:
            | "UNSUPPORTED"
            | "FAILED"
            | "ACCESS_DENIED"
            | "THREATS_FOUND"
            | "NO_THREATS_FOUND";
    };
    s3ObjectDetails: {
        bucketName: string;
        objectKey: string;
    };
};
