// @flow
import uniqueId from "uniqid";
import mime from "mime-types";
import sanitizeFilename from "sanitize-filename";

const respond = body => {
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(body, null, 2)
    };
};

const respondWithError = message => {
    return respond({
        code: "FILE_UPLOAD_FAILED",
        data: {
            message
        }
    });
};

export const handler = async (event: Object) => {
    const options = JSON.parse(event.body);

    const { name, type, size } = options;

    if (!name) {
        return respondWithError(`File "name" missing.`);
    }

    if (!size) {
        return respondWithError(`File "size" missing.`);
    }

    if (!type) {
        return respondWithError(`File "type" missing.`);
    }

    const contentType = mime.lookup(name);
    if (!contentType) {
        return respondWithError(`File's content type could not be resolved.`);
    }

    if (contentType !== type) {
        return respondWithError(`Detected and received file types don't match.`);
    }

    let key = sanitizeFilename(name);
    if (key) {
        key = uniqueId() + "_" + key;
    }

    // Replace all whitespace.
    key = key.replace(/\s/g, "");

    return respond({
        code: "FILE_UPLOAD_SUCCESS",
        data: {
            file: {
                name: key,
                src: "/files/" + key,
                type: contentType,
                size
            },
            s3: {
                url: "/files/upload",
                fields: {
                    "Content-Length": size,
                    "Content-Type": contentType,
                    key
                }
            }
        }
    });
};
