import fs from "fs";
import { getPulumi } from "./getPulumi";
import trimEnd from "lodash/trimEnd";
import { useContext } from "@webiny/cli";

// To use a self-managed backend, specify a storage endpoint URL as pulumi login’s <backend-url> argument:
// s3://<bucket-path>, azblob://<container-path>, gs://<bucket-path>, or file://<fs-path>.
// This will tell Pulumi to store state in AWS S3, Azure Blob Storage, Google Cloud Storage, or the
// local filesystem, respectively.
// @see https://www.pulumi.com/docs/intro/concepts/state/#logging-into-the-pulumi-service-backend
const SELF_MANAGED_BACKEND = ["s3://", "azblob://", "gs://"];

export const login = async (appName: string) => {
    const context = await useContext();
    // Do the login with Pulumi CLI.
    const pulumi = await getPulumi();

    // A couple of variations here, just to preserve backwards compatibility.
    let login =
        process.env.WEBINY_PULUMI_BACKEND ||
        process.env.WEBINY_PULUMI_BACKEND_URL ||
        process.env.PULUMI_LOGIN;

    if (login) {
        // If the user passed `s3://my-bucket`, we want to store files in `s3://my-bucket/{project-application-path}`
        const selfManagedBackend = SELF_MANAGED_BACKEND.find(item => login!.startsWith(item));
        if (selfManagedBackend) {
            login = trimEnd(login, "/") + "/" + appName;
            login = login.replace(/\\/g, "/");
        }
    } else {
        // By default, we use local file system as backend. All files are stored in project root's
        // `.pulumi` folder, e.g. `.pulumi/apps/admin`.
        const stateFilesFolder = context.resolve(".pulumi", appName);

        if (!fs.existsSync(stateFilesFolder)) {
            fs.mkdirSync(stateFilesFolder, { recursive: true });
        }

        login = `file://${stateFilesFolder}`;
    }

    await pulumi.run({
        command: ["login", login]
    });

    return { login };
};
