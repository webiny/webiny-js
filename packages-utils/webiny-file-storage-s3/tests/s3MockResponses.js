const mockResponses = {
    getObject: {
        success: {
            Body: "fooBar",
            AcceptRanges: "bytes",
            ContentLength: 3191,
            ContentType: "image/jpeg",
            ETag: "6805f2cfc46c0f04559748bb039d69ae",
            LastModified: "",
            Metadata: {},
            TagCount: 2,
            VersionId: "null"
        },
        error: {}
    },
    headObject: {
        success: {
            AcceptRanges: "bytes",
            ContentLength: 3191,
            ContentType: "image/jpeg",
            ETag: "6805f2cfc46c0f04559748bb039d69ae",
            LastModified: "Aug 21, 2016 8:51:53 PM GMT+0100",
            Metadata: {},
            TagCount: 2,
            VersionId: "null"
        }
    },
    listObjectsV2: {
        success: {
            Contents: [
                {
                    ETag: "70ee1738b6b21e2c8a43f3a5ab0eee71",
                    Key: "dir1/happyface.jpg",
                    LastModified: "Date",
                    Size: 11,
                    StorageClass: "STANDARD"
                },
                {
                    ETag: "becf17f89c30367a9a44495d62ed521a-1",
                    Key: "dir1/test.jpg",
                    LastModified: "Date",
                    Size: 4192256,
                    StorageClass: "STANDARD"
                },
                {
                    ETag: "becf17f89c30367a9a44495d62ed521a-2",
                    Key: "dir2/foo.jpg",
                    LastModified: "Date",
                    Size: 4192256,
                    StorageClass: "STANDARD"
                }
            ],
            IsTruncated: false,
            KeyCount: 3,
            MaxKeys: 1000,
            Name: "examplebucket",
            NextContinuationToken: "1w41l63U0xa8q7smH50vCxyTQqdxo69O3EmK28Bi5PcROI4wI/EyIJg==",
            Prefix: ""
        }
    }
};

export default mockResponses;
