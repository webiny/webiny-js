const os = require("os");
const tar = require("tar");
const fs = require("fs");
const download = require("download");
const path = require("path");
const extract = require("extract-zip");

const PULUMI_VERSION = "2.10.2";

export default async (downloadFolder, beforeInstall, afterInstall) => {
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

async function setupDarwin(downloadFolder) {
    const filename = `pulumi-v${PULUMI_VERSION}-darwin-x64.tar.gz`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    await download(downloadUrl, downloadFolder);

    await tar.extract({
        cwd: downloadFolder,
        file: path.join(downloadFolder, filename)
    });

    fs.unlinkSync(path.join(downloadFolder, filename));
}

async function setupWindows(downloadFolder) {
    const filename = `pulumi-v${PULUMI_VERSION}-windows-x64.zip`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    await download(downloadUrl, downloadFolder);

    await extractZip(path.join(downloadFolder, filename), filename);

    fs.unlinkSync(path.join(downloadFolder, filename));
}

async function setupLinux(downloadFolder) {
    const filename = `pulumi-v${PULUMI_VERSION}-linux-x64.tar.gz`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    await download(downloadUrl, downloadFolder);

    await tar.extract({
        cwd: downloadFolder,
        file: path.join(downloadFolder, filename)
    });

    fs.unlinkSync(path.join(downloadFolder, filename));
}

function extractZip(zipPath, dir) {
    return new Promise((resolve, reject) => {
        extract(zipPath, { dir }, e => {
            if (e) {
                reject(e);
                return;
            }
            resolve();
        });
    });
}
