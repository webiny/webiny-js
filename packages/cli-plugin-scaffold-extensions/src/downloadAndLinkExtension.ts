import os from "os";
import path from "path";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import { CliCommandScaffoldCallableArgs } from "@webiny/cli-plugin-scaffold/types";

import { linkAllExtensions } from "./generators/utils/linkAllExtensions";
import { Input } from "./types";
import { downloadFolderFromS3 } from "./downloadAndLinkExtension/downloadFolderFromS3";

const EXTENSIONS_ROOT_FOLDER = "extensions";

const S3_BUCKET_NAME = "wby-examples-test-1";
const S3_BUCKET_REGION = "eu-central-1";

const WEBINY_DEV_VERSION = "0.0.0";

const getVersionFromVersionFolders = async (
    versionFoldersList: string[],
    currentWebinyVersion: string
) => {
    const availableVersions = versionFoldersList.map(v => v.replace(".x", ".0")).sort();

    let versionToUse = "";

    // When developing Webiny, we want to use the latest version.
    if (currentWebinyVersion === WEBINY_DEV_VERSION) {
        versionToUse = availableVersions[availableVersions.length - 1];
    } else {
        for (const availableVersion of availableVersions) {
            if (currentWebinyVersion >= availableVersion) {
                versionToUse = availableVersion;
            } else {
                break;
            }
        }
    }

    return versionToUse.replace(".0", ".x");
};

export const downloadAndLinkExtension = async ({
    input,
    ora,
    context
}: CliCommandScaffoldCallableArgs<Input>) => {
    const currentWebinyVersion = context.version;

    const downloadExtensionSource = input.templateArgs!;

    try {
        ora.start(`Downloading extension...`);

        const randomId = String(Date.now());
        const downloadFolderPath = path.join(os.tmpdir(), `wby-ext-${randomId}`);
        await downloadFolderFromS3({
            bucketName: S3_BUCKET_NAME,
            bucketRegion: S3_BUCKET_REGION,
            bucketFolderKey: downloadExtensionSource,
            downloadFolderPath
        });

        ora.text = `Copying extension...`;

        // If we have `extensions` folder in the root of the downloaded extension, we can copy it directly.
        // This means the example extension is not versioned.
        const withoutVersions = fs.existsSync(path.join(downloadFolderPath, "extensions"));
        if (withoutVersions) {
            const extensionsFolderToCopy = path.join(downloadFolderPath, "extensions");
            await fsAsync.cp(extensionsFolderToCopy, EXTENSIONS_ROOT_FOLDER, {
                recursive: true
            });
        } else {
            // If we have `x.x.x` folders in the root of the downloaded extension, we need to find the right version to use.
            await new Promise(resolve => setTimeout(resolve, 1000));

            // This can be `5.40.x`, `5.41.x`, etc.
            const versionFolders = await fsAsync.readdir(downloadFolderPath);
            const versionToUse = await getVersionFromVersionFolders(
                versionFolders,
                currentWebinyVersion
            );

            const extensionsFolderToCopy = path.join(
                downloadFolderPath,
                versionToUse,
                "extensions"
            );

            await fsAsync.cp(extensionsFolderToCopy, EXTENSIONS_ROOT_FOLDER, {
                recursive: true
            });
        }

        ora.text = `Linking extension...`;
        await linkAllExtensions();

        ora.succeed(
            `Extension downloaded in ${context.success.hl(
                EXTENSIONS_ROOT_FOLDER + "/" + downloadExtensionSource
            )}.`
        );
    } catch (e) {
        ora.fail("Could not create extension. Please check the logs below.");
        console.log();
        console.log(e);
    }
};
