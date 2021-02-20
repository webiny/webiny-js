const getPulumi = require("../utils/getPulumi");
const trimEnd = require("lodash/trimEnd");

const DEFAULT_LOGIN = "file://";

module.exports = async projectApplicationFolder => {
    const pulumi = getPulumi({
        execa: {
            cwd: projectApplicationFolder
        }
    });

    let login = process.env.PULUMI_LOGIN || DEFAULT_LOGIN;

    // @see https://www.pulumi.com/docs/intro/concepts/state/#logging-into-the-pulumi-service-backend
    // To use a self-managed backend, specify a storage endpoint URL as pulumi login’s <backend-url> argument:
    // s3://<bucket-path>, azblob://<container-path>, gs://<bucket-path>, or file://<fs-path>.
    // This will tell Pulumi to store state in AWS S3, Azure Blob Storage, Google Cloud Storage, or the
    // local filesystem, respectively.

    // If `file://` or `http*`, we don't do anything. Otherwise, we append the stackFolder. For example, if
    // `s3://xyz` was received, and we're deploying `apps/website`, then we end up with `s3://xyz/apps/website`.
    if (login !== DEFAULT_LOGIN && !login.startsWith("http")) {
        login = trimEnd(login, "/") + "/" + projectApplicationFolder;
    }

    await pulumi.run({
        command: ["login", login]
    });
};
