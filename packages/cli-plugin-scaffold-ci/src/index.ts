import {
    CliCommandScaffoldTemplate,
    TsConfigJson,
    PackageJson
} from "@webiny/cli-plugin-scaffold/types";
import fs from "fs";
import path from "path";
import util from "util";
import ncpBase from "ncp";
import readJson from "load-json-file";
import writeJson from "write-json-file";
import pluralize from "pluralize";
import Case from "case";
import { replaceInPath } from "replace-in-path";
import chalk from "chalk";
import indentString from "indent-string";
import WebinyError from "@webiny/error";
import execa from "execa";
import validateNpmPackageName from "validate-npm-package-name";
import { getProject } from "@webiny/cli/utils";
import { Octokit } from "octokit";
import commitWorkflows from "./commitWorkflows";

const ncp = util.promisify(ncpBase.ncp);

interface Input {
    provider: string;
    githubAccessToken: string;
    newOrExistingRepo: "newRepo" | "existingRepo";
    newRepoName: string;
    newRepoPrivacyType: "public" | "private";
    existingRepoName: string;
}

const createPackageName = ({
    initial,
    location
}: {
    initial?: string;
    location: string;
}): string => {
    if (initial) {
        return initial;
    }
    return Case.kebab(location);
};

let octokit: Octokit;

type Await<T> = T extends PromiseLike<infer U> ? U : T;
let user: Await<ReturnType<typeof octokit.rest.users.getAuthenticated>>["data"];

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-ci",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "Set up a CI/CD pipeline",
        questions: () => {
            return [
                {
                    name: "provider",
                    type: "list",
                    choices: [{ name: "GitHub Actions", value: "githubActions" }],
                    message: "Choose your CI/CD provider:",
                    default: "githubActions"
                },
                {
                    name: "githubAccessToken",
                    type: "password",
                    message: `Paste your GitHub personal access token (create a new one via https://github.com/settings/tokens/new?scopes=repo&description=123):`,
                    required: true,
                    validate: async answer => {
                        // TODO: remove this.
                        answer = "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";

                        octokit = new Octokit({ auth: answer });

                        try {
                            user = await octokit.rest.users
                                .getAuthenticated()
                                .then(({ data }) => data);
                            return true;
                        } catch {
                            return "Invalid GitHub personal access token provided.";
                        }
                    }
                }
                /*{
                    name: "newOrExistingRepo",
                    message: `Would you like to create a new code repository or select an existing one?`,
                    type: "list",
                    default: "newRepo",
                    choices: [
                        { name: "Create a new repository", value: "newRepo" },
                        { name: "Choose existing repository", value: "existingRepo" }
                    ]
                },
                {
                    name: "newRepoName",
                    message: `Enter your code repository name:`,
                    required: true,
                    when: answers => answers.newOrExistingRepo === "newRepo",
                    validate: async answer => {
                        const repos = await octokit.rest.repos.listForAuthenticatedUser();
                        for (let i = 0; i < repos.data.length; i++) {
                            const repo = repos.data[i];
                            if (repo.name === answer) {
                                return "A code repository with given name already exists.";
                            }
                        }
                        return true;
                    }
                },
                {
                    name: "newRepoPrivacyType",
                    message: "Please select the type of code repository to create:",
                    when: answers => answers.newOrExistingRepo === "newRepo",
                    type: "list",
                    default: "newRepoPrivate",
                    choices: [
                        { name: "Public", value: "public" },
                        { name: "Private", value: "private" }
                    ]
                },
                {
                    name: "existingRepoName",
                    message: "Please select your code repository:",
                    when: answers => answers.newOrExistingRepo === "existingRepo",
                    type: "list",
                    choices: async () => {
                        const repos = await octokit.rest.repos.listForAuthenticatedUser();
                        return repos.data.map(item => item.name);
                    }
                }*/
            ];
        },
        generate: async ({ input, oraSpinner }) => {
            const { newRepoName, existingRepoName, newRepoPrivacyType } = input;
            if (newRepoName) {
                oraSpinner.start(`Creating ${chalk.green(newRepoName)} code repository...`);

                await octokit.rest.repos.createForAuthenticatedUser({
                    name: newRepoName,
                    private: newRepoPrivacyType === "private"
                });
                oraSpinner.stopAndPersist({
                    symbol: chalk.green("✔"),
                    text: `${chalk.green(newRepoName)} code repository created.`
                });
            }

            oraSpinner.start(`Committing and pushing GitHub Actions workflows...`);
            try {
                await commitWorkflows({
                    octokit,
                    org: user.login,
                    repo: "pvt" || newRepoName || existingRepoName
                });
            } catch (e) {
                console.log(e);
            }

            return;

            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `GitHub Actions workflows Committed and pushed.`
            });

            oraSpinner.start(
                `Creating long-lived ${chalk.green("dev")}, ${chalk.green(
                    "staging"
                )}, and ${chalk.green("prod")} branches`
            );

            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Long-lived ${chalk.green("dev")}, ${chalk.green(
                    "staging"
                )}, and ${chalk.green("prod")} branches created.`
            });

            return;
        },
        onSuccess: async ({ input }) => {
            return;
            const { componentName, location, packageName: initialPackageName } = input;

            const name = Case.pascal(componentName);
            const packageName = createPackageName({
                initial: initialPackageName,
                location
            });

            console.log("1. Include the package in your applications package.json file:");
            console.log(
                indentString(
                    chalk.green(`
// somewhere in your dependencies
"${packageName}": "^1.0.0"
`),
                    2
                )
            );

            console.log("2. Import your component:");
            console.log(
                indentString(
                    chalk.green(`
// at the top of the file
import { ${name} } from "${packageName}";

// use in the code
<${name} />
`),
                    2
                )
            );

            console.log(
                "Learn more about app development at https://www.webiny.com/docs/tutorials/create-an-application/introduction."
            );
        }
    }
});
