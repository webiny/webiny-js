const os = require("os");
const tar = require("tar");
const fs = require("fs");
const download = require("download");
const path = require("path");
const ora = require("ora");
const { green } = require("chalk");

const PULUMI_VERSION = "2.10.2";
const BINARIES_FOLDER = path.join(__dirname, "binaries");

(async () => {
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
                `Platform "${platform}" not supported. Supported ones are "darwin", "linux", and "win32"`
            );
    }
})();

async function setupDarwin() {
    const filename = `pulumi-v${PULUMI_VERSION}-darwin-x64.tar.gz`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    const spinner = new ora();

    spinner.start(`[@webiny/pulumi-sdk] Downloading Pulumi binaries...`);
    await download(downloadUrl, BINARIES_FOLDER);

    await tar.extract({
        cwd: BINARIES_FOLDER,
        file: path.join(BINARIES_FOLDER, filename)
    });

    fs.unlinkSync(path.join(BINARIES_FOLDER, filename));

    spinner.stopAndPersist({
        symbol: green("✔"),
        text: `[@webiny/pulumi-sdk] Pulumi binaries downloaded!`
    });
}

async function setupWindows() {
    const filename = `pulumi-v${PULUMI_VERSION}-windows-x64.zip`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    const spinner = new ora();

    spinner.start(`[@webiny/pulumi-sdk] Downloading Pulumi binaries...`);
    await download(downloadUrl, BINARIES_FOLDER);

    await tar.extract({
        cwd: BINARIES_FOLDER,
        file: path.join(BINARIES_FOLDER, filename)
    });

    fs.unlinkSync(path.join(BINARIES_FOLDER, filename));

    spinner.stopAndPersist({
        symbol: green("✔"),
        text: `[@webiny/pulumi-sdk] Pulumi binaries downloaded!`
    });
}

async function setupLinux() {
    const filename = `pulumi-v${PULUMI_VERSION}-linux-x64.tar.gz`;
    const downloadUrl = "https://get.pulumi.com/releases/sdk/" + filename;

    const spinner = new ora();

    spinner.start(`[@webiny/pulumi-sdk] Downloading Pulumi binaries...`);
    await download(downloadUrl, BINARIES_FOLDER);

    await tar.extract({
        cwd: BINARIES_FOLDER,
        file: path.join(BINARIES_FOLDER, filename)
    });

    fs.unlinkSync(path.join(BINARIES_FOLDER, filename));

    spinner.stopAndPersist({
        symbol: green("✔"),
        text: `[@webiny/pulumi-sdk] Pulumi binaries downloaded!`
    });
}
