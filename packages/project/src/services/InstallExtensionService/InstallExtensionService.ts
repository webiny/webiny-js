import os from "os";
import path from "path";
import fs from "fs";
import fsAsync from "fs/promises";
import { parse as parseJsonc } from "jsonc-parser";
import { createImplementation } from "@webiny/di";
import {
    InstallExtensionService,
    GetProjectVersionService,
    GetProjectService
} from "~/abstractions/index.js";
import { downloadFolderFromS3, NoObjectsFoundError } from "./downloadFolderFromS3.js";
import { mergePackageJson } from "./mergePackageJson.js";
import { updateWebinyConfig } from "./updateWebinyConfig.js";
import type { ExtensionJsonc, InstallExtensionParams, InstallExtensionResult } from "./types.js";

const EXTENSIONS_ROOT_FOLDER = "extensions";
const S3_BUCKET_NAME = "webiny-examples";
const S3_BUCKET_REGION = "us-east-1";
const FOLDER_NAME_IS_VERSION_REGEX = /^\d+\.\d+\.x$/;
const WEBINY_DEV_VERSION = "0.0.0";

const getVersionFromVersionFolders = async (
    versionFoldersList: string[],
    currentWebinyVersion: string
) => {
    const availableVersions = versionFoldersList
        .filter(v => v.match(FOLDER_NAME_IS_VERSION_REGEX))
        .map(v => v.replace(/\.x$/, ".0"))
        .sort();

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

    return versionToUse.replace(/\.0$/, ".x");
};

class DefaultInstallExtensionService implements InstallExtensionService.Interface {
    constructor(
        private getProjectVersion: GetProjectVersionService.Interface,
        private getProject: GetProjectService.Interface
    ) {}

    async execute(params: InstallExtensionParams): Promise<InstallExtensionResult> {
        const { source, onProgress, onSuccess, onError } = params;

        try {
            const currentWebinyVersion = this.getProjectVersion.execute();
            const project = this.getProject.execute();
            const projectRoot = project.paths.rootFolder.toString();

            onProgress?.("Downloading extension...");

            const randomId = String(Date.now());
            const downloadFolderPath = path.join(os.tmpdir(), `wby-ext-${randomId}`);

            await downloadFolderFromS3({
                bucketName: S3_BUCKET_NAME,
                bucketRegion: S3_BUCKET_REGION,
                bucketFolderKey: source,
                downloadFolderPath
            });

            onProgress?.("Processing extension...");

            let extensionsFolderToCopyPath = path.join(downloadFolderPath, "extensions");
            let extensionJsoncPath = path.join(downloadFolderPath, "extension.jsonc");

            // If we have `extensions` folder in the root of the downloaded extension,
            // it means the extension is not versioned, and we can just copy it.
            const extensionsFolderExistsInRoot = fs.existsSync(extensionsFolderToCopyPath);
            const versionedExtension = !extensionsFolderExistsInRoot;

            if (versionedExtension) {
                // If we have `x.x.x` folders in the root of the downloaded
                // extension, we need to find the right version to use.

                // This can be `5.40.x`, `6.0.x`, etc.
                const versionFolders = await fsAsync.readdir(downloadFolderPath);

                const versionToUse = await getVersionFromVersionFolders(
                    versionFolders,
                    currentWebinyVersion
                );

                extensionsFolderToCopyPath = path.join(
                    downloadFolderPath,
                    versionToUse,
                    "extensions"
                );

                const subExtensionJsoncPath = path.join(
                    downloadFolderPath,
                    versionToUse,
                    "extension.jsonc"
                );
                if (fs.existsSync(subExtensionJsoncPath)) {
                    extensionJsoncPath = subExtensionJsoncPath;
                }
            }

            // Read and parse extension.jsonc
            const extensionJsoncExists = fs.existsSync(extensionJsoncPath);
            const extensionJsonc: ExtensionJsonc = extensionJsoncExists
                ? parseJsonc(fs.readFileSync(extensionJsoncPath, "utf-8"))
                : { name: "unknown", type: "unknown" };

            onProgress?.("Copying extension files...");

            // Ensure the extensions root folder exists
            const targetExtensionsFolder = path.join(projectRoot, EXTENSIONS_ROOT_FOLDER);
            if (!fs.existsSync(targetExtensionsFolder)) {
                fs.mkdirSync(targetExtensionsFolder, { recursive: true });
            }

            // Copy the extensions folder contents
            await fsAsync.cp(extensionsFolderToCopyPath, targetExtensionsFolder, {
                recursive: true
            });

            // Get the list of extensions that were copied
            const extensionsFolderNames = await fsAsync.readdir(extensionsFolderToCopyPath);
            const extensionPaths = extensionsFolderNames.map(name =>
                path.join(EXTENSIONS_ROOT_FOLDER, name)
            );

            // Merge package.json if provided
            if (extensionJsonc.packageJson && Object.keys(extensionJsonc.packageJson).length > 0) {
                onProgress?.("Updating package.json...");
                await mergePackageJson({
                    projectRoot,
                    extensionPackageJson: extensionJsonc.packageJson
                });
            }

            // Update webiny.config.tsx if provided
            if (extensionJsonc.webinyConfigTsx) {
                onProgress?.("Updating webiny.config.tsx...");
                await updateWebinyConfig({
                    projectRoot,
                    webinyConfigTsx: extensionJsonc.webinyConfigTsx
                });
            }

            // Build success message
            if (extensionPaths.length === 1) {
                onSuccess?.(
                    `Extension "${extensionJsonc.name}" downloaded successfully to ${extensionPaths[0]}`
                );
            } else {
                onSuccess?.(
                    `Extension "${extensionJsonc.name}" with multiple components downloaded successfully`
                );
            }

            // Extract next steps and additional notes
            const nextSteps = extensionJsonc.nextSteps?.messages || [];
            const additionalNotes = extensionJsonc.additionalNotes?.messages || [];

            return {
                success: true,
                extensionName: extensionJsonc.name,
                extensionPaths,
                nextSteps,
                additionalNotes
            };
        } catch (error: any) {
            const errorMessage =
                error instanceof NoObjectsFoundError
                    ? "Could not download extension. The extension does not exist."
                    : "Could not download extension. Please check the error details.";

            onError?.(errorMessage, error);

            return {
                success: false,
                error
            };
        }
    }
}

export const installExtensionService = createImplementation({
    abstraction: InstallExtensionService,
    implementation: DefaultInstallExtensionService,
    dependencies: [GetProjectVersionService, GetProjectService]
});
