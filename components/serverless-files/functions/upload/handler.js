const uniqueId = require("uniqid");
const sanitizeFilename = require("sanitize-filename");
const S3 = require("aws-sdk/clients/s3");
const mime = require("mime");

const FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED";
const FILE_UPLOAD_SUCCESS = "FILE_UPLOAD_SUCCESS";

module.exports.handler = async event => {
    console.log(JSON.stringify(event));
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;

    /*const { site, file } = event;
    if (!file) {
        return {
            code: FILE_UPLOAD_FAILED,
            data: {
                message: `Field "file" is missing.`
            }
        };
    }

    if (!file.name) {
        return {
            code: FILE_UPLOAD_FAILED,
            data: {
                message: `File "name" missing.`
            }
        };
    }

    const contentType = mime.getType(file.name);
    if (!contentType) {
        return {
            code: FILE_UPLOAD_FAILED,
            data: {
                message: `File's content type could not be resolved.`
            }
        };
    }

    let key = sanitizeFilename(file.name);
    if (key) {
        key = uniqueId() + "_" + key;
    }

    // Replace all whitespace.
    key = key.replace(/\s/g, "");

    const s3 = new S3();
    return new Promise(resolve => {
        const params = {
            Expires: 60,
            Bucket: site.uploadsFolder.bucket,
            Conditions: [["content-length-range", 100, 26214400]], // 100Byte - 25MB
            Fields: {
                "Content-Type": contentType,
                key: `${site.uploadsFolder.paths.relative}/${key}`
            }
        };

        if (params.Fields.key.startsWith("/")) {
            params.Fields.key = params.Fields.key.substr(1);
        }

        s3.createPresignedPost(params, (err, data) => {
            if (err) {
                resolve({
                    code: FILE_UPLOAD_FAILED,
                    data: {
                        message: err.message
                    }
                });
            } else {
                resolve({
                    code: FILE_UPLOAD_SUCCESS,
                    data: {
                        file: {
                            name: key,
                            type: contentType,
                            size: file.size,
                            src: "/files/" + key
                        },
                        s3: data
                    }
                });
            }
        });
    });*/
};
