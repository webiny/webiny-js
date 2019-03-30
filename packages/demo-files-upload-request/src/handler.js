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

export const handler = async (event: Object) => {
    const options = JSON.parse(event.body);

    const { name } = options;

    if (!name) {
        return respond({
            code: "FILE_UPLOAD_FAILED",
            data: {
                message: `File "name" missing.`
            }
        });
    }

    const contentType = mime.lookup(name);
    if (!contentType) {
        return respond({
            code: "FILE_UPLOAD_FAILED",
            data: {
                message: `File's content type could not be resolved.`
            }
        });
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
                name,
                src: "/files/" + key
            },
            s3: {
                url: "/files/upload",
                fields: {
                    "Content-Type": contentType,
                    key
                }
            }
        }
    });
};
