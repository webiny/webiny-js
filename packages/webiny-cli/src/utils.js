const fs = require("fs-extra");
const spawn = require("cross-spawn");
const path = require("path");

function copyFile(from, to) {
    fs.copySync(path.join(__dirname, from), path.join(process.cwd(), to));
}

function spawnCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: "inherit", ...options });
        child.on("close", code => {
            if (code !== 0) {
                reject({
                    command: `${command} ${args.join(" ")}`
                });
                return;
            }
            resolve();
        });
    });
}

module.exports = { copyFile, spawnCommand };
