#!/usr/bin/env node
const Listr = require("listr");
const { green } = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");
const indent = require("indent-string");

// Add indentation to console.log output
const log = console.log;
console.log = (first = "", ...args) => {
    if (typeof first === "string") {
        log(indent(first, 2), ...args);
    } else {
        log(first, ...args);
    }
};

(async () => {
    console.log(
        [
            ``,
            `This utility will upgrade your current Webiny project from version ${green(
                "4.0.2"
            )} to ${green("4.1.0")}!`,
            `If you encounter any problems during this process, feel free to get in touch:`,
            `- Github: https://github.com/webiny/webiny-js`,
            `- Slack: https://www.webiny.com/slack`,
            ``
        ].join("\n")
    );
    const upgrade = new Listr([
        {
            title: "Checking git status",
            task: () =>
                execa.stdout("git", ["status", "--porcelain"]).then(result => {
                    if (result !== "") {
                        throw new Error("Unclean working tree. Commit or stash changes first.");
                    }
                })
        },
        {
            title: "Applying patch",
            task: async () => {
                await execa("git", ["apply", path.join(__dirname, "upgrade.patch")]);
                await fs.remove(path.join(process.cwd(), "api", "files", "transform", "build"));
            }
        },
        {
            title: "Updating dependencies",
            task: async () => {
                await fs.unlink("yarn.lock");
                await execa("yarn", []);
            }
        },
        {
            title: "Verifying update",
            task: async () => {
                const { version } = require(require.resolve("@webiny/cli/package.json", {
                    paths: [process.cwd()]
                }));
                if (version !== "4.1.0") {
                    console.log(
                        [
                            `Looks like ${green("yarn")} did not pull the latest package versions.`,
                            `You can try doing it manually, by running ${green(
                                "yarn upgrade --scope=@webiny"
                            )}.`
                        ].join("\n")
                    );
                    throw Error("Update of @webiny packages failed!");
                }
            }
        }
    ]);

    await upgrade.run();

    console.log(``);
    console.log(`Done! Your project was successfully upgraded to ${green("4.1.0")}.`);
})();
