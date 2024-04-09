import os from "os";
// @ts-expect-error `tar` has no types.
import tar from "tar";
import fs from "fs";
import path from "path";
// @ts-expect-error `tar` has no types.
import decompress from "decompress";
import semver from "semver";
import { downloadFile } from "./downloadFile";

// We need to sanitize the package version because, occasionally, we've noticed that the Pulumi version
// can look like the following: "2.25.2+dirty". We want to ensure only "2.25.2" is returned.
// @see https://github.com/pulumi/pulumi/issues/6847
const getPulumiVersion = () => {
    const { version } = require("@pulumi/pulumi/package.json");
    return semver.clean(version);
};

export default async (
    downloadFolder: string,
    beforeInstall?: () => void,
    afterInstall?: () => void
) => {
    if (fs.existsSync(downloadFolder)) {
        return false;
    }

    if (typeof beforeInstall === "function") {
        await beforeInstall();
    }

    const platform = os.platform();
    switch (platform) {
        case "darwin":
            await setupDarwin(downloadFolder);
            break;
        case "linux":
            await setupLinux(downloadFolder);
            break;
        case "win32":
            await setupWindows(downloadFolder);
            break;
        default:
            throw Error(
                `Cannot download Pulumi binaries - platform "${platform}" not supported. Supported ones are "darwin", "linux", and "win32"`
            );
    }

    if (typeof afterInstall === "function") {
        await afterInstall();
    }

    return true;
};

const SUPPORTED_ARCHITECTURES = ["x64", "arm64"];

async function setupDarwin(downloadFolder: string) {
    const version = getPulumiVersion();
    const arch = SUPPORTED_ARCHITECTURES.includes(process.arch) ? process.arch : "x64";

    const filename = `pulumi-v${version}-darwin-${arch}.tar.gz`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    const absoluteFilename = path.join(downloadFolder, filename);
    await downloadFile(downloadUrl, absoluteFilename);

    await tar.extract({
        cwd: downloadFolder,
        file: absoluteFilename
    });

    fs.unlinkSync(path.join(downloadFolder, filename));
}

async function setupWindows(downloadFolder: string) {
    const version = getPulumiVersion();
    const filename = `pulumi-v${version}-windows-x64.zip`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    const absoluteFilename = path.join(downloadFolder, filename);
    await downloadFile(downloadUrl, absoluteFilename);

    const destination = path.join(downloadFolder, "pulumi");
    await decompress(absoluteFilename, destination, { strip: 2 });

    fs.unlinkSync(path.join(downloadFolder, filename));
}

async function setupLinux(downloadFolder: string) {
    const version = getPulumiVersion();
    const filename = `pulumi-v${version}-linux-x64.tar.gz`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    const absoluteFilename = path.join(downloadFolder, filename);
    await downloadFile(downloadUrl, absoluteFilename);

    await tar.extract({
        cwd: downloadFolder,
        file: absoluteFilename
    });

    fs.unlinkSync(path.join(downloadFolder, filename));
}
