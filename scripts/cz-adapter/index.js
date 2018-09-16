// @flowIgnore
/* eslint-disable */
const path = require("path");
const execa = require("execa");
const buildCommit = require("cz-customizable/buildCommit");
const getPackages = require("get-yarn-workspaces");
const chalk = require("chalk");
const commitAnalyzer = require("@semantic-release/commit-analyzer");
const autocomplete = require("inquirer-autocomplete-prompt");
const maxLengthInput = require("inquirer-maxlength-input-prompt");
const commitTypes = require("./types");
const rightPad = require("right-pad");
const { map } = require("lodash");
const longest = require("longest");

// Create default prompter
function makeAffectsLine({ packages = [] }) {
    if (packages.length) {
        return `affects: ${packages.join(", ")}`;
    }
}

function getCommitTypeMessage(type) {
    if (!type || type === "no") {
        return "This commit does not indicate any release.";
    }
    return {
        patch: "🛠  This commit indicates a patch release (0.0.X)",
        minor: "✨  This commit indicates a minor release (0.X.0)",
        major: "💥  This commit indicates a major release (X.0.0)"
    }[type];
}

function getAllPackages() {
    return getPackages(process.cwd()).map(dir => {
        return {
            name: path.basename(dir),
            location: dir
        };
    });
}

function getStagedFiles() {
    return execa.sync("git", ["diff", "--cached", "--name-only"]).stdout.split("\n");
}

function getChangedPackages(stagedFiles) {
    return getAllPackages()
        .filter(pkg => {
            const packagePrefix = path.relative(".", pkg.location) + path.sep;
            for (let stagedFile of stagedFiles) {
                if (stagedFile.indexOf(packagePrefix) === 0) {
                    return true;
                }
            }
        })
        .map(pkg => pkg.name);
}

function formatTypes(types) {
    const length = longest(Object.keys(types)).length + 1;
    return map(types, (type, key) => {
        return {
            name: type.emoji + "  " + rightPad(key + ":", length) + " " + type.description,
            value: key
        };
    });
}

module.exports = {
    prompter: (cz, commitCb) => {
        cz.registerPrompt("autocomplete", autocomplete);
        cz.registerPrompt("maxlength-input", maxLengthInput);

        const stagedFiles = getStagedFiles();
        const allPackages = getAllPackages().map(pkg => pkg.name);
        const changedPackages = getChangedPackages(stagedFiles);

        const types = formatTypes(commitTypes);

        console.log("\nFiles staged for commit:");
        stagedFiles.forEach(file => {
            console.log(`- ${chalk.green(file)}`);
        });
        console.log("\n");

        cz.prompt([
            {
                type: "autocomplete",
                name: "type",
                message: "Select the type of change that you're committing:",
                choices: types,
                source: (answersSoFar, input) => {
                    if (!input) {
                        return Promise.resolve(types);
                    }
                    return Promise.resolve(
                        types.filter(type => type.name.toLowerCase().indexOf(input) > -1)
                    );
                }
            },
            /*{
                type: "input",
                name: "scope",
                message: "Denote the scope of this change ($location, $browser, $compile, etc.):\n"
            },*/
            {
                type: "maxlength-input",
                maxLength: 60,
                name: "subject",
                message:
                    "Write a short, imperative tense description of the change (60 characters max):\n"
            },
            {
                type: "input",
                name: "body",
                message: "Provide a longer description of the change:\n"
            },
            {
                type: "input",
                name: "breaking",
                message: "List any breaking changes:\n"
            },
            {
                type: "input",
                name: "issues",
                message: "List any issues closed by this change:\n"
            },
            {
                type: "checkbox",
                name: "packages",
                default: changedPackages,
                choices: allPackages,
                message: `The packages that this commit has affected (${
                    changedPackages.length
                } detected)\n`
            }
        ]).then(async answers => {
            // Add emoji to commit message
            answers.subject = commitTypes[answers.type].emoji + "  " + answers.subject;

            // Add list of affected packages
            const affectsLine = makeAffectsLine(answers);
            if (affectsLine) {
                answers.body = `${affectsLine}\n` + answers.body;
            }

            // Build commit message
            const message = buildCommit(answers);

            // Run commit-analyzer to detect the type of this commit
            const type = await commitAnalyzer(
                {},
                { commits: [{ hash: "", message }], logger: { log: () => {} } }
            );

            console.log(chalk.green(`\n${getCommitTypeMessage(type)}\n`));
            console.log("\n\nCommit message:");
            console.log(chalk.blue(`\n\n${message}\n`));
            commitCb(message);
        });
    }
};
