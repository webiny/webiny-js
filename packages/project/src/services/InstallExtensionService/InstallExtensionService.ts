import os from "os";
import path from "path";
import fs from "fs";
import fsAsync from "fs/promises";
import loadJsonFile from "load-json-file";
import { createImplementation } from "@webiny/di";
import {
    InstallExtensionService,
    GetProjectVersionService,
    GetProjectService
} from "~/abstractions/index.js";
import { downloadFolderFromS3 } from "./downloadFolderFromS3.js";
import { mergePackageJson } from "./mergePackageJson.js";
import { updateWebinyConfig } from "./updateWebinyConfig.js";
import type { ExtensionJson } from "./types.js";

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

    async execute(source: string): Promise<InstallExtensionService.Result> {
        const currentWebinyVersion = this.getProjectVersion.execute();
        const project = this.getProject.execute();
        const projectRoot = project.paths.rootFolder.toString();

        const randomId = String(Date.now());
        const downloadFolderPath = path.join(os.tmpdir(), `wby-ext-${randomId}`);

        // Check if source is a local path
        const isLocalPath =
            source.startsWith("../") || source.startsWith("./") || source.startsWith("/");

        if (isLocalPath) {
            // Resolve the local path relative to the project root
            const resolvedPath = path.isAbsolute(source)
                ? source
                : path.resolve(projectRoot, source);

            // Copy the local directory to the temporary download folder
            await fsAsync.cp(resolvedPath, downloadFolderPath, {
                recursive: true
            });
        } else {
            // Download from S3
            await downloadFolderFromS3({
                bucketName: S3_BUCKET_NAME,
                bucketRegion: S3_BUCKET_REGION,
                bucketFolderKey: source,
                downloadFolderPath
            });
        }

        let extensionsFolderToCopyPath = path.join(downloadFolderPath, "extensions");
        let extensionJsonPath = path.join(downloadFolderPath, "extension.json");

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

            extensionsFolderToCopyPath = path.join(downloadFolderPath, versionToUse, "extensions");
            const subExtensionJsonPath = path.join(
                downloadFolderPath,
                versionToUse,
                "extension.json"
            );
            if (fs.existsSync(subExtensionJsonPath)) {
                extensionJsonPath = subExtensionJsonPath;
            }
        }

        // Read and parse extension.json.
        const extensionJsonExists = fs.existsSync(extensionJsonPath);
        const extensionJson: ExtensionJson = extensionJsonExists
            ? await loadJsonFile(extensionJsonPath)
            : { name: "unknown", type: "admin" };

        // Ensure the extensions root folder exists.
        const targetExtensionsFolder = path.join(projectRoot, EXTENSIONS_ROOT_FOLDER);
        if (!fs.existsSync(targetExtensionsFolder)) {
            fs.mkdirSync(targetExtensionsFolder, { recursive: true });
        }

        // Copy the extensions folder contents.
        await fsAsync.cp(extensionsFolderToCopyPath, targetExtensionsFolder, {
            recursive: true
        });

        // Get the list of extensions that were copied.
        const extensionsFolderNames = await fsAsync.readdir(extensionsFolderToCopyPath);
        const extensionPaths = extensionsFolderNames.map(name =>
            path.join(EXTENSIONS_ROOT_FOLDER, name)
        );

        // Merge package.json if provided.
        if (extensionJson.packageJson && Object.keys(extensionJson.packageJson).length > 0) {
            await mergePackageJson({
                projectRoot,
                extensionPackageJson: extensionJson.packageJson
            });
        }

        // Update webiny.config.tsx if provided.
        if (extensionJson.webinyConfigTsx) {
            await updateWebinyConfig({
                projectRoot,
                webinyConfigTsx: extensionJson.webinyConfigTsx
            });
        }

        // Extract next steps and additional notes.
        const nextSteps = extensionJson.nextSteps?.messages || [];
        const additionalNotes = extensionJson.additionalNotes?.messages || [];

        return {
            extensionName: extensionJson.name,
            extensionPaths,
            nextSteps,
            additionalNotes
        };
    }
}

export const installExtensionService = createImplementation({
    abstraction: InstallExtensionService,
    implementation: DefaultInstallExtensionService,
    dependencies: [GetProjectVersionService, GetProjectService]
});
