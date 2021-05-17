import { CliPluginsScaffoldCi } from "../types";
import { Octokit } from "octokit";
import chalk from "chalk";
import commitWorkflows from "./commitWorkflows";
import terminalLink from "terminal-link";
import validateNpmPackageName from "validate-npm-package-name";

type Await<T> = T extends PromiseLike<infer U> ? U : T;

interface Input {
    provider: string;
    githubAccessToken: string;
    newOrExistingRepo: "newRepo" | "existingRepo";
    newRepoName: string;
    newRepoOrgName: string;
    newRepoPrivacyType: "public" | "private";
    existingRepo: {
        name: string;
        owner: string;
    };
}

let octokit: Octokit;
let user: Await<ReturnType<typeof octokit.rest.users.getAuthenticated>>["data"];
let repo: Await<ReturnType<typeof octokit.rest.repos.createForAuthenticatedUser>>["data"];

const NEW_TOKEN_URL =
    "https://github.com/settings/tokens/new?scopes=repo,workflow&description=webiny-cicd-token";
const newPatTokenLink = terminalLink("a new one", NEW_TOKEN_URL, {
    fallback: () => "a new one via " + NEW_TOKEN_URL
});

const plugin: CliPluginsScaffoldCi<Input> = {
    type: "cli-plugin-scaffold-ci",
    name: "cli-plugin-scaffold-ci-github",
    provider: "githubActions",
    questions: () => {
        return [
            {
                name: "githubAccessToken",
                type: "password",
                message: `Paste your GitHub personal access token (or create ${newPatTokenLink}):`,
                required: true,
                validate: async answer => {
                    octokit = new Octokit({ auth: answer });

                    try {
                        user = await octokit.rest.users.getAuthenticated().then(({ data }) => data);
                    } catch (e) {
                        return "Invalid GitHub personal access token provided.";
                    }

                    return true;
                }
            },
            {
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
                name: "newRepoOrgName",
                when: answers => answers.newOrExistingRepo === "newRepo",
                message:
                    "Select an organization within which the new repository will be created (optional):",
                type: "list",
                default: null,
                choices: async () => {
                    const organizations = await octokit.rest.orgs.listForAuthenticatedUser();
                    return [
                        { name: "Create within my own account", value: null },
                        { type: "separator" },
                        ...organizations.data.map(item => item.login)
                    ];
                }
            },
            {
                name: "newRepoName",
                message: `Enter your code repository name:`,
                required: true,
                when: answers => answers.newOrExistingRepo === "newRepo",
                validate: async (answer, answers) => {
                    const repos = await octokit.rest.repos.listForAuthenticatedUser();
                    for (let i = 0; i < repos.data.length; i++) {
                        const repo = repos.data[i];
                        const owner = answers.newRepoOrgName || user.login;
                        if (repo.name === answer && repo.owner.login === owner) {
                            return "A code repository with given name already exists.";
                        }
                    }

                    if (!validateNpmPackageName(answer).validForNewPackages) {
                        return "An invalid repository name provided.";
                    }
                    return true;
                }
            },
            {
                name: "newRepoPrivacyType",
                message: "Please select the type of code repository to create:",
                when: answers => answers.newOrExistingRepo === "newRepo",
                type: "list",
                default: "private",
                choices: [
                    { name: "Public", value: "public" },
                    { name: "Private", value: "private" }
                ]
            },
            {
                name: "existingRepo",
                message: "Please select your code repository:",
                when: answers => answers.newOrExistingRepo === "existingRepo",
                type: "list",
                choices: async () => {
                    return octokit.rest.repos.listForAuthenticatedUser().then(response => {
                        return response.data.map(data => ({
                            name: data.full_name,
                            value: {
                                name: data.name,
                                owner: data.owner.login
                            }
                        }));
                    });
                }
            }

            // TODO: AWS secrets, want to paste them now or later?

        ];
    },
    onGenerate: async ({ input, inquirer }) => {
        const { newRepoName, newRepoOrgName, existingRepo, newRepoPrivacyType } = input;
        const prompt = inquirer.createPromptModule();

        console.log();
        console.log(`${chalk.bold("The following operations will be performed on your behalf:")}`);

        // 1. Create a new repo or get existing.
        if (newRepoName) {
            let message = `- create a new ${chalk.green(
                input.newRepoName
            )} ${newRepoPrivacyType} code repository`;

            if (newRepoOrgName) {
                message += ` (within ${chalk.green(newRepoOrgName)} organization)`;
            }

            console.log(message);
        } else {
            console.log(
                `- select existing ${chalk.green(
                    existingRepo.name
                )} code repository (owned by ${chalk.green(existingRepo.owner)})`
            );
        }

        console.log(
            `- push GitHub actions workflow files (located in ${chalk.green(".github/workflows")})`
        );
        console.log(
            `- create protected ${chalk.green("dev")}, ${chalk.green("staging")}, and ${chalk.green(
                "prod"
            )} branches`
        );

        console.log(`- set ${chalk.green("dev")} as the default branch`);

        const { proceed } = await prompt({
            name: "proceed",
            message: `Are you sure you want to continue?`,
            type: "confirm",
            default: false
        });

        if (!proceed) {
            process.exit(0);
        }
        console.log();
    },
    generate: async ({ input, ora }) => {
        const { newRepoName, newRepoOrgName, existingRepo, newRepoPrivacyType } = input;

        // 1. Create a new repo or get existing.
        if (newRepoName) {
            ora.start(`Creating ${chalk.green(newRepoName)} code repository...`);

            if (newRepoOrgName) {
                repo = await octokit.rest.repos
                    .createInOrg({
                        org: newRepoOrgName,
                        name: newRepoName,
                        private: newRepoPrivacyType === "private"
                    })
                    .then(response => response.data);
            } else {
                repo = await octokit.rest.repos
                    .createForAuthenticatedUser({
                        name: newRepoName,
                        private: newRepoPrivacyType === "private"
                    })
                    .then(response => response.data);
            }

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `${chalk.green(newRepoName)} code repository created.`
            });
        } else {
            repo = await octokit.rest.repos
                .get({
                    repo: existingRepo.name,
                    owner: existingRepo.owner
                })
                .then(response => response.data);
        }

        // 2. Let's commit GitHub Actions workflows.
        ora.start(`Creating GitHub Actions workflows...`);
        await commitWorkflows({
            octokit,
            owner: repo.owner.login,
            repo: repo.name,
            branch: repo.default_branch,
            author: {
                name: user.name,
                email: user.email
            }
        });

        ora.stopAndPersist({
            symbol: chalk.green("✔"),
            text: `GitHub Actions workflows created.`
        });

        // 3. Create protected (long-lived) branches.
        ora.start(
            `Creating long-lived ${chalk.green("dev")}, ${chalk.green(
                "staging"
            )}, and ${chalk.green("prod")} branches...`
        );

        const latestCommitSha = await octokit.rest.git
            .getRef({
                owner: repo.owner.login,
                repo: repo.name,
                ref: `heads/${repo.default_branch}`
            })
            .then(({ data }) => data.object.sha);

        const longLivedBranches = ["dev", "staging", "prod"];
        for (let i = 0; i < longLivedBranches.length; i++) {
            const longLivedBranch = longLivedBranches[i];
            await octokit.rest.git.createRef({
                owner: repo.owner.login,
                repo: repo.name,
                ref: `refs/heads/${longLivedBranch}`,
                sha: latestCommitSha
            });
        }

        ora.stopAndPersist({
            symbol: chalk.green("✔"),
            text: `Long-lived ${chalk.green("dev")}, ${chalk.green("staging")}, and ${chalk.green(
                "prod"
            )} branches created.`
        });

        // 4. Protecting branches...
        ora.start(`Enabling protection for created long-lived branches...`);

        try {
            for (let i = 0; i < longLivedBranches.length; i++) {
                const longLivedBranch = longLivedBranches[i];
                await octokit.rest.repos.updateBranchProtection({
                    owner: repo.owner.login,
                    repo: repo.name,
                    branch: longLivedBranch,
                    allow_force_pushes: false,
                    allow_deletions: false,
                    enforce_admins: null,
                    required_pull_request_reviews: null,
                    restrictions: null,
                    required_status_checks: {
                        strict: true,
                        contexts: []
                    }
                });
            }

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Protection enabled for created long-lived branches.`
            });
        } catch (e) {
            ora.stopAndPersist({
                symbol: chalk.red("✘"),
                text: `Enabling protection for long-lived branches failed with the following message: ${e.message}`
            });
        }

        // 5. Make "dev" branch the default one.
        ora.start(`Setting ${chalk.green("dev")} as the default branch.`);

        await octokit.rest.repos.update({
            owner: repo.owner.login,
            repo: repo.name,
            branch: repo.default_branch,
            default_branch: "dev"
        });

        ora.stopAndPersist({
            symbol: chalk.green("✔"),
            text: `Set ${chalk.green("dev")} as the default branch.`
        });

        // 4. These should automatically deploy three stages. Test it out.

        // 5. Success

        // 6. How will the user know which are the URLs to deployed infra? He would need to go to GH actions right?

        // 7. You can delete the 'main' btw.
        // TODO: tell the user to commit all files if new repo.
        // add Link to the repo
        return;
    },
    onSuccess: async ({ input }) => {
        const { newRepoName } = input;

        console.log();
        console.log(`${chalk.green("✔")} CI/CD pipeline successfully set up.`);

        console.log();
        console.log(chalk.bold("Next steps:"));

        const githubLink = terminalLink("GitHub", repo.html_url, {
            fallback: () => `GitHub (${repo.url})`
        });

        if (newRepoName) {
            console.log(`- push your project files into the ${chalk.green("dev")} branch`);
            console.log(`- delete the initial default (${chalk.green(`main`)}) branch (optional)`);
        }

        console.log(`- start developing by branching from the ${chalk.green("dev")} branch`);
        console.log(`- browse the ${chalk.green(repo.full_name)} repository on ${githubLink}`);

        const DOCS_URL = "https://www.webiny.com/docs/todo";
        const docsLink = terminalLink("documentation", DOCS_URL, {
            fallback: () => `documentation (${DOCS_URL})`
        });

        console.log(`- check out the ${docsLink} for more information`);
    }
};

export default plugin;
