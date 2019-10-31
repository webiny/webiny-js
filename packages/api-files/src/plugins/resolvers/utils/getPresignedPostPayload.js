// @flow
import uniqueId from "uniqid";
import sanitizeFilename from "sanitize-filename";
import S3 from "aws-sdk/clients/s3";
import mime from "mime";

const S3_BUCKET = process.env.S3_BUCKET;

export default data => {
    const contentType = mime.getType(data.name);
    if (!contentType) {
        throw Error(`File's content type could not be resolved.`);
    }

    let key = sanitizeFilename(data.name);
    if (key) {
        key = uniqueId() + "-" + key;
    }

    // Replace all whitespace.
    key = key.replace(/\s/g, "");

    const params = {
        Expires: 60,
        Bucket: S3_BUCKET,
        Conditions: [["content-length-range", 100, 26214400]], // 100Byte - 25MB
        Fields: {
            "Content-Type": contentType,
            key
        }
    };

    if (params.Fields.key.startsWith("/")) {
        params.Fields.key = params.Fields.key.substr(1);
    }

    const s3 = new S3();
    const payload = s3.createPresignedPost(params);

    return {
        data: payload,
        file: {
            name: key,
            key,
            type: contentType,
            size: data.size,
        }
    };
};
