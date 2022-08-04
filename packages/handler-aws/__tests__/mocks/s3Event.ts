import { S3Event } from "aws-lambda";
import { S3EventRecord } from "aws-lambda/trigger/s3";

const defaultRecord: S3EventRecord = {
    awsRegion: "us-east-1",
    eventName: "event",
    eventSource: "source",
    eventTime: new Date().toISOString(),
    eventVersion: "1.0.0",
    glacierEventData: {
        restoreEventData: {
            lifecycleRestoreStorageClass: "storageClass",
            lifecycleRestorationExpiryTime: "expiryTime"
        }
    },
    responseElements: {
        "x-amz-id-2": "amz-id",
        "x-amz-request-id": "amx-request-id"
    },
    requestParameters: {
        sourceIPAddress: "127.0.0.1"
    },
    s3: {
        s3SchemaVersion: "1.0.0",
        bucket: {
            name: "s3-bucket",
            arn: "arn",
            ownerIdentity: {
                principalId: "123456"
            }
        },
        configurationId: "1234567890",
        object: {
            key: "key",
            eTag: "tag",
            size: 100,
            sequencer: "sequencer",
            versionId: "1.0.0"
        }
    },
    userIdentity: {
        principalId: "12345"
    }
};

export const createS3Event = (options: Partial<S3Event> = {}): S3Event => {
    return {
        Records: [defaultRecord],
        ...(options || {})
    };
};
