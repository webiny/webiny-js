const os = require("os");
const tar = require("tar");
const fs = require("fs");
const download = require("download");
const path = require("path");

const PULUMI_VERSION = "2.10.2";
const BINARIES_FOLDER = path.join(__dirname, "binaries");

export default async (beforeInstall, afterInstall) => {
    if (fs.existsSync(BINARIES_FOLDER)) {
        return false;
    }

    if (typeof beforeInstall === "function") {
        await beforeInstall();
    }

    const platform = os.platform();
    switch (platform) {
        case "darwin":
            await setupDarwin();
            break;
        case "linux":
            await setupLinux();
            break;
        case "win32":
            await setupWindows();
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

async function setupDarwin() {
    const filename = `pulumi-v${PULUMI_VERSION}-darwin-x64.tar.gz`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    await download(downloadUrl, BINARIES_FOLDER);

    await tar.extract({
        cwd: BINARIES_FOLDER,
        file: path.join(BINARIES_FOLDER, filename)
    });

    fs.unlinkSync(path.join(BINARIES_FOLDER, filename));
}

async function setupWindows() {
    const filename = `pulumi-v${PULUMI_VERSION}-windows-x64.zip`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    await download(downloadUrl, BINARIES_FOLDER);

    await tar.extract({
        cwd: BINARIES_FOLDER,
        file: path.join(BINARIES_FOLDER, filename)
    });

    fs.unlinkSync(path.join(BINARIES_FOLDER, filename));
}

async function setupLinux() {
    const filename = `pulumi-v${PULUMI_VERSION}-linux-x64.tar.gz`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    await download(downloadUrl, BINARIES_FOLDER);

    await tar.extract({
        cwd: BINARIES_FOLDER,
        file: path.join(BINARIES_FOLDER, filename)
    });

    fs.unlinkSync(path.join(BINARIES_FOLDER, filename));
}
