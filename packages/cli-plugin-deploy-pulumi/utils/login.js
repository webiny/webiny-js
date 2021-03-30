const getPulumi = require("../utils/getPulumi");
const trimEnd = require("lodash/trimEnd");
const fs = require("fs");

// To use a self-managed backend, specify a storage endpoint URL as pulumi login’s <backend-url> argument:
// s3://<bucket-path>, azblob://<container-path>, gs://<bucket-path>, or file://<fs-path>.
// This will tell Pulumi to store state in AWS S3, Azure Blob Storage, Google Cloud Storage, or the
// local filesystem, respectively.
// @see https://www.pulumi.com/docs/intro/concepts/state/#logging-into-the-pulumi-service-backend
const SELF_MANAGED_BACKEND = ["s3://", "azblob://", "gs://"];

module.exports = async projectApplication => {
    const pulumi = await getPulumi({
        execa: {
            cwd: projectApplication.path.absolute
        }
    });

    let login = process.env.WEBINY_PULUMI_BACKEND_URL;
    if (login) {
        // Determine if we use as single storage for all Pulumi projects. If so, append project application path.
        const selfManagedBackend = SELF_MANAGED_BACKEND.find(item => login.startsWith(item));
        if (selfManagedBackend) {
            login = trimEnd(login, "/") + "/" + projectApplication.path.relative;
        }
    } else {
        const stateFilesFolder = `${projectApplication.path.project}/.pulumi/${projectApplication.path.relative}`;
        if (!fs.existsSync(stateFilesFolder)) {
            fs.mkdirSync(stateFilesFolder);
        }
        login = `file://${stateFilesFolder}`;
    }

    await pulumi.run({
        command: ["login", login]
    });
};
