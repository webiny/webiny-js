import { CliPluginsScaffoldCi } from "../types";
import { Octokit } from "octokit";
import chalk from "chalk";
import commitWorkflows from "./commitWorkflows";
import getCurrentCommit from "./getCurrentCommit";

interface Input {
    provider: string;
    githubAccessToken: string;
    newOrExistingRepo: "newRepo" | "existingRepo";
    newRepoName: string;
    newRepoPrivacyType: "public" | "private";
    existingRepoName: string;
}

let octokit: Octokit;

type Await<T> = T extends PromiseLike<infer U> ? U : T;
let user: Await<ReturnType<typeof octokit.rest.users.getAuthenticated>>["data"];

const GH_CREATE_TOKEN_URL =
    "https://github.com/settings/tokens/new?scopes=repo,workflow&description=Webiny%20CI/CD%20Set%20Up%20Token";

const plugin: CliPluginsScaffoldCi<Input> = {
    type: "cli-plugin-scaffold-ci",
    name: "cli-plugin-scaffold-ci-github",
    provider: "githubActions",
    questions: () => {
        return [
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
                        user = await octokit.rest.users.getAuthenticated().then(({ data }) => data);
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
            },

            // TODO: AWS secrets, want to paste them now or later?
            */

            // TODO: add summary step (dev, staging, prod branches warning)
        ];
    },
    generate: async ({ input, oraSpinner }) => {
        const { newRepoName, existingRepoName, newRepoPrivacyType } = input;

        // 1. Create a new repo if needed (user didn't select an existing one).
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

        const repo = "pvt" || newRepoName || existingRepoName;
        const owner = user.login;
        const defaultBranch = "main";

        // 2. Let's commit workflow files.
        oraSpinner.start(`Committing and pushing GitHub Actions workflows...`);
        await commitWorkflows({
            octokit,
            owner,
            repo,
            branch: defaultBranch
        });

        oraSpinner.stopAndPersist({
            symbol: chalk.green("✔"),
            text: `GitHub Actions workflows Committed and pushed.`
        });

        oraSpinner.start(
            `Creating long-lived ${chalk.green("dev")}, ${chalk.green(
                "staging"
            )}, and ${chalk.green("prod")} branches...`
        );

        // 3. Create long-lived branches.

        const currentCommit = await getCurrentCommit({
            octokit,
            owner,
            repo,
            branch: defaultBranch
        });

        // 3.1 Create.
        const longLivedBranches = ["dev", "staging", "production"];
        for (let i = 0; i < longLivedBranches.length; i++) {
            const longLivedBranch = longLivedBranches[i];
            await octokit.rest.git.createRef({
                owner,
                repo,
                ref: `refs/heads/${longLivedBranch}`,
                sha: currentCommit.commitSha
            });
        }

        // 3.1 Make created long-lived branches protected.
        oraSpinner.stopAndPersist({
            symbol: chalk.green("✔"),
            text: `Long-lived ${chalk.green("dev")}, ${chalk.green("staging")}, and ${chalk.green(
                "prod"
            )} branches created.`
        });

        // 4. These should automatically deploy three stages. Test it out.

        // 5. Success

        // 6. How will the user know which are the URLs to deployed infra? He would need to go to GH actions right?

        return;
    }
};

export default plugin;
