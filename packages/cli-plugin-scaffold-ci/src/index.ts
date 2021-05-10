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

const GH_CREATE_TOKEN_URL =
    "https://github.com/settings/tokens/new?scopes=repo,workflow&description=Webiny%20CI/CD%20Set%20Up%20Token";

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
                    message: `Paste your GitHub personal access token (create a new one via ${GH_CREATE_TOKEN_URL}):`,
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
                        } catch (e) {
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
            await commitWorkflows({
                octokit,
                org: user.login,
                repo: "pvt" || newRepoName || existingRepoName
            });

            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `GitHub Actions workflows Committed and pushed.`
            });

            oraSpinner.start(
                `Creating long-lived ${chalk.green("dev")}, ${chalk.green(
                    "staging"
                )}, and ${chalk.green("prod")} branches`
            );

            const { data: refData } = await octokit.rest.git.getRef({
                owner: user,
                repo: 'pvt',
                ref: `heads/${branch}`
            });
            const commitSha = refData.object.sha;

            https://api.github.com/repos/camosuit/test1/git/refs/heads/

            octokit.rest.repos.getHead
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

            console.log(
                "Learn more about app development at https://www.webiny.com/docs/tutorials/create-an-application/introduction."
            );
        }
    }
});
