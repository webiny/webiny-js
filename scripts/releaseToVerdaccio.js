const execa = require("execa");
const path = require("path");
const get = require("lodash.get");
const fs = require("fs-extra");
const yargs = require("yargs");

yargs.usage("$0 <version> <tag>").command(
    "$0 <publishVersion> <tag>",
    "Publish to verdaccio",
    yargs => {
        yargs.positional("publishVersion", {
            describe: "Publish version"
        });
        yargs.positional("tag", {
            describe: "NPM dist-tag"
        });
    },
    async ({ publishVersion, tag }) => {
        // Version packages
        const { stdout } = await execa("lerna", [
            "version",
            publishVersion,
            "--preid",
            tag,
            "--force-publish",
            "--no-git-tag-version",
            "--no-push",
            "--no-changelog",
            "--yes"
        ]);

        console.log(stdout);

        // Commit
        console.log("Performing git commit...");
        await execa("git", ["add", "."]);
        await execa("git", ["commit", "-m", `chore: release v${publishVersion}`]);

        // Copy package.json files
        const whitelist = path.resolve("packages");
        const packages = require("get-yarn-workspaces")()
            .map(pkg => pkg.replace(/\//g, path.sep))
            .reduce((acc, pkg) => {
                if (pkg.startsWith(whitelist)) {
                    acc.push(pkg);
                }
                return acc;
            }, []);

        for (let i = 0; i < packages.length; i++) {
            try {
                const packageJson = path.resolve(packages[i], "package.json");
                if (!fs.existsSync(packageJson)) {
                    continue;
                }

                const pkg = require(packageJson);

                if (pkg.private) {
                    continue;
                }

                const targetDirectory = get(pkg, "publishConfig.directory");
                if (targetDirectory === ".") {
                    continue;
                }

                const target = path.resolve(packages[i], targetDirectory);

                await fs.unlink(path.join(target, "package.json"));
                await fs.copyFile(packageJson, path.join(target, "package.json"));
            } catch (err) {
                console.log(`Failed ${packages[i].name}: ${err.message}`);
                throw err;
            }
        }

        // Publish to verdaccio
        console.log("Publishing to Verdaccio...");
        await execa("lerna", [
            "publish",
            "from-package",
            "--ignore-scripts",
            "--registry=http://localhost:4800",
            "--dist-tag",
            tag,
            "--yes"
        ]);

        console.log(`Done!`);
    }
);

yargs.argv;
