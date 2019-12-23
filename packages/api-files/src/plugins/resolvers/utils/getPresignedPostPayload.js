var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import uniqueId from "uniqid";
import sanitizeFilename from "sanitize-filename";
import S3 from "aws-sdk/clients/s3";
import mime from "mime";
import { validation } from "@webiny/validation";
const S3_BUCKET = process.env.S3_BUCKET;
const UPLOAD_MAX_FILE_SIZE = process.env.UPLOAD_MAX_FILE_SIZE;
const UPLOAD_MAX_FILE_SIZE_DEFAULT = 26214400; // 25MB
const UPLOAD_MIN_FILE_SIZE = process.env.UPLOAD_MIN_FILE_SIZE;
const sanitizeFileSizeValue = (value, defaultValue) => {
    try {
        validation.validateSync(value, "required,numeric,gte:0");
        return value;
    }
    catch (e) {
        return defaultValue;
    }
};
export default (data) => __awaiter(void 0, void 0, void 0, function* () {
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
    const uploadMinFileSize = sanitizeFileSizeValue(UPLOAD_MIN_FILE_SIZE, 0);
    const uploadMaxFileSize = sanitizeFileSizeValue(UPLOAD_MAX_FILE_SIZE, UPLOAD_MAX_FILE_SIZE_DEFAULT);
    const params = {
        Expires: 60,
        Bucket: S3_BUCKET,
        Conditions: [["content-length-range", uploadMinFileSize, uploadMaxFileSize]],
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
            size: data.size
        }
    };
});
