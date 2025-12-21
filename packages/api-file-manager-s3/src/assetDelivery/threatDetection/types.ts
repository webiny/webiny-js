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
