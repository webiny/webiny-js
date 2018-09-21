// @flowIgnore
/* eslint-disable */
const execa = require("execa");
const buildCommit = require("cz-customizable/buildCommit");
const chalk = require("chalk");
const autocomplete = require("inquirer-autocomplete-prompt");
const maxLengthInput = require("inquirer-maxlength-input-prompt");
const commitTypes = require("./types");
const rightPad = require("right-pad");
const { map } = require("lodash");
const longest = require("longest");

function getStagedFiles() {
    return execa.sync("git", ["diff", "--cached", "--name-only"]).stdout.split("\n");
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
            }
        ]).then(async answers => {
            // Add emoji to commit message
            answers.subject = commitTypes[answers.type].emoji + "  " + answers.subject;

            // Build commit message
            const message = buildCommit(answers);
            console.log("\n\nCommit message:");
            console.log(chalk.blue(`\n\n${message}\n`));
            commitCb(message);
        });
    }
};
