// @flow
import { Response } from "@webiny/api";
import uniqueId from "uniqid";
import sanitizeFilename from "sanitize-filename";
import S3 from "aws-sdk/clients/s3";
import mime from "mime";

const S3_BUCKET = process.env.S3_BUCKET;

export default async (root: any, args: Object) => {
    const { data: file } = args;
    const contentType = mime.getType(file.name);
    if (!contentType) {
        throw Error(`File's content type could not be resolved.`);
    }

    let key = sanitizeFilename(file.name);
    if (key) {
        key = uniqueId() + "_" + key;
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
    const data = s3.createPresignedPost(params).promise();

    return new Response({
        data,
        file: {
            name: key,
            type: contentType,
            size: file.size,
            src: "/files/" + key
        }
    });
};
