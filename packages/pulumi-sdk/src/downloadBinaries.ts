const os = require("os");
const tar = require("tar");
const fs = require("fs");
const download = require("download");
const path = require("path");
const decompress = require("decompress");
const semver = require("semver");

// We gotta sanitize the package version, since on a few occasions, we've detected the Pulumi version
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

    await download(downloadUrl, downloadFolder);

    await tar.extract({
        cwd: downloadFolder,
        file: path.join(downloadFolder, filename)
    });

    fs.unlinkSync(path.join(downloadFolder, filename));
}

async function setupWindows(downloadFolder: string) {
    const version = getPulumiVersion();
    const filename = `pulumi-v${version}-windows-x64.zip`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    await download(downloadUrl, downloadFolder);

    const archive = path.join(downloadFolder, filename);
    const destination = path.join(downloadFolder, "pulumi");
    await decompress(archive, destination, { strip: 2 });

    fs.unlinkSync(path.join(downloadFolder, filename));
}

async function setupLinux(downloadFolder: string) {
    const version = getPulumiVersion();
    const filename = `pulumi-v${version}-linux-x64.tar.gz`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    console.log("downloading linux", downloadUrl);
    try {
        await download(downloadUrl, downloadFolder);
    } catch (e) {
        console.log(e.message);
        console.log(e.stack);
        console.log(e);
        throw e;
    }

    console.log("download done");

    await tar.extract({
        cwd: downloadFolder,
        file: path.join(downloadFolder, filename)
    });

    fs.unlinkSync(path.join(downloadFolder, filename));

    console.log("extarccing done");
}
