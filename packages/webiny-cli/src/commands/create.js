// @flow
const fs = require("fs-extra");
const download = require("download");
const extract = require("extract-zip");
const execSync = require("child_process").execSync;
const cli = require("./../cli");

exports.command = "create <name>";
exports.describe = "Create a new Webiny app.";
exports.builder = (yargs: Object) => {
    return yargs.positional("name", {
        describe: "Name of the app (also the name of the app folder).",
        type: "string"
    });
};

exports.handler = async function(argv: Object) {
    const name = argv.name;
    cli.validateName(name);

    const cwd = process.cwd();
    const paths = {
        cwd,
        repo: "https://github.com/Pavel910/webiny-boilerplate/archive/master.zip",
        zip: cwd + "/github_boilerplate_temp.zip",
        app: {
            root: cwd + "/" + name,
            api: cwd + "/" + name + "/api",
            client: cwd + "/" + name + "/client"
        }
    };

    cli.info("Downloading...");
    await downloadAndUnzipBoilerplate(paths);

    cli.info("Installing API dependencies...");
    execSync(`cd ${paths.app.api} && yarn`, { stdio: [0, 1, 2] });

    cli.info("Installing client dependencies...");
    execSync(`cd ${paths.app.client} && yarn`, { stdio: [0, 1, 2] });
};

function downloadAndUnzipBoilerplate(paths) {
    return new Promise((resolve, reject) => {
        download(paths.repo).then(data => {
            fs.writeFileSync(paths.zip, data);

            extract(paths.zip, { dir: paths.cwd }, function(err) {
                fs.unlinkSync(paths.zip);
                if (err) {
                    reject(err);
                    return;
                }

                fs.rename(paths.cwd + "/webiny-boilerplate-master", paths.app.root);
                resolve();
            });
        });
    });
}
