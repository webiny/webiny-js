import os from "os";
import path from "path";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import { CliCommandScaffoldCallableArgs } from "@webiny/cli-plugin-scaffold/types";

import { linkAllExtensions } from "./generators/utils/linkAllExtensions";
import { Input } from "./types";
import { downloadFolderFromS3 } from "./downloadAndLinkExtension/downloadFolderFromS3";

const EXTENSIONS_ROOT_FOLDER = "extensions";

const S3_BUCKET_NAME = "wby-examples-test";
const S3_BUCKET_REGION = "us-east-1";

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

        ora.text = `Linking extension...`;
        const withoutVersions = fs.existsSync(path.join(downloadFolderPath, "extensions"));
        if (withoutVersions) {
            const extensionsFolderToCopy = path.join(downloadFolderPath, "extensions");
            await fsAsync.cp(extensionsFolderToCopy, EXTENSIONS_ROOT_FOLDER, {
                recursive: true
            });
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const availableVersions = await fsAsync.readdir(downloadFolderPath).then(versions => {
                return versions.map(v => v.replace(".x", ".0")).sort();
            });

            let versionToUse = "";

            // When developing Webiny, we want to use the latest version.
            if (currentWebinyVersion === "0.0.0") {
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

            versionToUse = versionToUse.replace(".0", ".x");

            const extensionsFolderToCopy = path.join(
                downloadFolderPath,
                versionToUse,
                "extensions"
            );
            await fsAsync.cp(extensionsFolderToCopy, EXTENSIONS_ROOT_FOLDER, {
                recursive: true
            });
        }

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
