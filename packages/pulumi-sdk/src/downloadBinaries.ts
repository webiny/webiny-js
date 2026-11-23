import os from "os";
import * as tar from "tar";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import semver from "semver";
import { findUpSync } from "find-up";
import { loadJsonFileSync } from "load-json-file";
import { downloadFile } from "./downloadFile.js";
import { removeUnusedFolders } from "./removeUnusedFolders.js";
import { PackageJson } from "type-fest";

// We need to sanitize the package version because, occasionally, we've noticed that the Pulumi version
// can look like the following: "2.25.2+dirty". We want to ensure only "2.25.2" is returned.
// @see https://github.com/pulumi/pulumi/issues/6847
const getPulumiVersion = () => {
    const pkgJsonPath = findUpSync("node_modules/@pulumi/pulumi/package.json");
    const { version } = loadJsonFileSync<PackageJson>(pkgJsonPath!);
    return semver.clean(version!);
};

/*
 * Each Pulumi version is downloaded once into the store's CLI folder and shared by every project
 * that uses it. The archive is extracted into a temporary folder and renamed into place, so a project
 * that finds the folder never sees a half-extracted CLI, even while another project is downloading it.
 * Returns the folder that holds the `pulumi` executable.
 */
export default async (
    cliFolders: string,
    beforeInstall?: () => void,
    afterInstall?: () => void
): Promise<string> => {
    const platform = os.platform();
    if (platform !== "darwin" && platform !== "linux" && platform !== "win32") {
        throw Error(
            `Cannot download Pulumi binaries - platform "${platform}" not supported. Supported ones are "darwin", "linux", and "win32"`
        );
    }

    const version = getPulumiVersion();
    const filename = getDownloadFilename(version!, platform);
    const cliFolderName = filename.replace(/\.(tar\.gz|zip)$/, "");
    const cliFolder = path.join(cliFolders, cliFolderName);
    const binaryFolder = path.join(cliFolder, "pulumi");

    if (fs.existsSync(binaryFolder)) {
        removeUnusedCliVersions(cliFolders, cliFolderName);
        return binaryFolder;
    }

    if (typeof beforeInstall === "function") {
        await beforeInstall();
    }

    fs.mkdirSync(cliFolders, { recursive: true });
    const tempFolder = fs.mkdtempSync(`${cliFolder}.`);
    try {
        await setupPlatform(tempFolder, filename, platform);
        moveIntoPlace(tempFolder, cliFolder);
    } finally {
        fs.rmSync(tempFolder, { recursive: true, force: true });
    }

    removeUnusedCliVersions(cliFolders, cliFolderName);

    if (typeof afterInstall === "function") {
        await afterInstall();
    }

    return binaryFolder;
};

function removeUnusedCliVersions(cliFolders: string, cliFolderName: string) {
    removeUnusedFolders({
        parentFolder: cliFolders,
        keep: cliFolderName,
        match: name => name.startsWith("pulumi-v")
    });
}

function moveIntoPlace(tempFolder: string, cliFolder: string) {
    try {
        fs.renameSync(tempFolder, cliFolder);
    } catch (error) {
        // Another project downloaded the same version first.
        const binaryFolder = path.join(cliFolder, "pulumi");
        if (!fs.existsSync(binaryFolder)) {
            throw error;
        }
    }
}

const SUPPORTED_ARCHITECTURES = ["x64", "arm64"];

type SupportedPlatform = "darwin" | "linux" | "win32";

function getDownloadFilename(version: string, platform: SupportedPlatform): string {
    switch (platform) {
        case "darwin": {
            const arch = SUPPORTED_ARCHITECTURES.includes(process.arch) ? process.arch : "x64";
            return `pulumi-v${version}-darwin-${arch}.tar.gz`;
        }
        case "linux":
            return `pulumi-v${version}-linux-x64.tar.gz`;
        case "win32":
            return `pulumi-v${version}-windows-x64.zip`;
    }
}

async function setupPlatform(
    downloadFolder: string,
    filename: string,
    platform: SupportedPlatform
) {
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    const absoluteFilename = path.join(downloadFolder, filename);
    await downloadFile(downloadUrl, absoluteFilename);

    if (platform === "win32") {
        extractZip(absoluteFilename, path.join(downloadFolder, "pulumi"));
    } else {
        await tar.extract({ cwd: downloadFolder, file: absoluteFilename });
    }

    fs.unlinkSync(absoluteFilename);
}

function extractZip(zipPath: string, destination: string) {
    fs.mkdirSync(destination, { recursive: true });

    const zip = new AdmZip(zipPath);
    const stripComponents = 2;
    const destinationResolved = path.resolve(destination);

    for (const entry of zip.getEntries()) {
        if (entry.isDirectory) {
            continue;
        }

        const segments = entry.entryName.split(/[\\/]+/).slice(stripComponents);
        if (segments.length === 0) {
            continue;
        }

        if (segments.some(s => s === ".." || path.isAbsolute(s))) {
            throw new Error(`Unsafe zip entry: ${entry.entryName}`);
        }

        const targetPath = path.resolve(destinationResolved, ...segments);
        if (!targetPath.startsWith(destinationResolved + path.sep)) {
            throw new Error(`Zip slip detected: ${entry.entryName}`);
        }

        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, entry.getData());
    }
}
