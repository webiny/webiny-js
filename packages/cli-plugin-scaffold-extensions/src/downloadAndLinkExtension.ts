import os from "os";
import path from "path";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import { CliCommandScaffoldCallableArgs } from "@webiny/cli-plugin-scaffold/types";
import { setTimeout } from "node:timers/promises";
import { WEBINY_DEV_VERSION } from "~/utils/constants";
import { linkAllExtensions } from "./utils/linkAllExtensions";
import { DownloadedExtensionData, Input } from "./types";
import { downloadFolderFromS3 } from "./downloadAndLinkExtension/downloadFolderFromS3";
import { setWebinyPackageVersions } from "~/utils/setWebinyPackageVersions";
import { runYarnInstall } from "@webiny/cli-plugin-scaffold/utils";
import { getDownloadedExtensionType } from "~/downloadAndLinkExtension/getDownloadedExtensionType";
import { generators } from "./downloadAndLinkExtension/generators";

const EXTENSIONS_ROOT_FOLDER = "extensions";

const S3_BUCKET_NAME = "webiny-examples";
const S3_BUCKET_REGION = "us-east-1";

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
        await setTimeout(1000);

        let extensionsFolderToCopyPath = path.join(downloadFolderPath, "extensions");

        // If we have `extensions` folder in the root of the downloaded extension.
        // it means the example extension is not versioned, and we can just copy it.
        const extensionsFolderExistsInRoot = fs.existsSync(extensionsFolderToCopyPath);
        const versionedExtension = !extensionsFolderExistsInRoot;

        if (versionedExtension) {
            // If we have `x.x.x` folders in the root of the downloaded
            // extension, we need to find the right version to use.

            // This can be `5.40.x`, `5.41.x`, etc.
            const versionFolders = await fsAsync.readdir(downloadFolderPath);

            const versionToUse = await getVersionFromVersionFolders(
                versionFolders,
                currentWebinyVersion
            );

            extensionsFolderToCopyPath = path.join(downloadFolderPath, versionToUse, "extensions");
        }

        await fsAsync.cp(extensionsFolderToCopyPath, EXTENSIONS_ROOT_FOLDER, {
            recursive: true
        });

        ora.text = `Linking extension...`;

        const downloadedExtensions: DownloadedExtensionData[] = [];

        // Retrieve extensions folders in the root of the downloaded extension. We use this
        // later to run additional setup tasks on each extension.
        const extensionsFolderNames = await fsAsync.readdir(extensionsFolderToCopyPath);

        for (const extensionsFolderName of extensionsFolderNames) {
            const folderName = extensionsFolderName;
            const folderPath = path.join(EXTENSIONS_ROOT_FOLDER, extensionsFolderName);

            downloadedExtensions.push({
                folderName,
                folderPath,
                extensionType: await getDownloadedExtensionType(folderPath),
                packageJsonPath: path.join(
                    EXTENSIONS_ROOT_FOLDER,
                    extensionsFolderName,
                    "package.json"
                )
            });
        }

        for (const downloadedExtension of downloadedExtensions) {
            await setWebinyPackageVersions(downloadedExtension.folderPath, currentWebinyVersion);
        }

        await linkAllExtensions();
        await runYarnInstall();

        if (extensionsFolderNames.length === 1) {
            const [extensionFolderName] = extensionsFolderNames;
            ora.succeed(
                `Extension downloaded in ${context.success.hl(
                    EXTENSIONS_ROOT_FOLDER + "/" + extensionFolderName
                )}.`
            );
        } else {
            const paths = extensionsFolderNames.map(name => EXTENSIONS_ROOT_FOLDER + "/" + name);
            ora.succeed(`Extensions downloaded in ${context.success.hl(paths.join(", "))}.`);
        }

        for (const downloadedExtension of downloadedExtensions) {
            if (!downloadedExtension.extensionType) {
                continue;
            }
            const generator = generators[downloadedExtension.extensionType];
            if (!generator) {
                continue;
            }

            const { nextSteps } = await generator({
                input: {
                    name: downloadedExtension.folderName,
                    packageName: downloadedExtension.folderName,
                    location: downloadedExtension.folderPath
                }
            });

            if (nextSteps) {
                nextSteps.forEach(step => ora.info(step));
            }
        }
    } catch (e) {
        switch (e.code) {
            case "NO_OBJECTS_FOUND":
                ora.fail("Could not download extension. Looks like the extension does not exist.");
                break;
            default:
                ora.fail("Could not create extension. Please check the logs below.");
                console.log();
                console.log(e);
        }
    }
};
