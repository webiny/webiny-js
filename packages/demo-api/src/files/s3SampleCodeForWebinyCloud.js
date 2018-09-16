// @flowIgnore
// This file just holds S3 sample code

/*
const s3 = new AWS.S3({
    accessKeyId: "AKIA_something...",
    secretAccessKey: "secret-access-key"
});

const fileurls = [];
const myBucket = "bucket-webiny-uploads";
const myKey = `api/uploads/test.csv`;
const signedUrlExpireSeconds = 60 * 60;
const params = {
    Bucket: myBucket,
    Key: myKey,
    Expires: signedUrlExpireSeconds,
    ACL: `bucket-owner-full-control`,
    ContentType: `text/csv`
};

s3.getSignedUrl("putObject", params, function(err, url) {
    if (err) {
        console.log("Error getting presigned url from AWS S3");
        res.json({ success: false, message: "Pre-Signed URL error", urls: fileurls });
    } else {
        fileurls[0] = url;
        console.log("Presigned URL: ", fileurls[0]);
        res.json({
            success: true,
            message: "AWS SDK S3 Pre-signed urls generated successfully.",
            urls: fileurls
        });
    }
});*/
