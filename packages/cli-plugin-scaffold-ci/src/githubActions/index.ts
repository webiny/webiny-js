import { CliPluginsScaffoldCi } from "~/types";
import { Octokit } from "octokit";
import chalk from "chalk";
import commitWorkflows from "~/githubActions/commitWorkflows";
import fetchAllRepositories from "~/githubActions/fetchAllRepositories";
import validateNpmPackageName from "validate-npm-package-name";
import open from "open";
import { validation } from "@webiny/validation";

type Await<T> = T extends PromiseLike<infer U> ? U : T;

export interface GithubActionsInput {
    provider: string;
    githubAccessTokenCreate: string;
    githubAccessToken: string;
    newOrExistingRepo: "newRepo" | "existingRepo";
    newRepoName: string;
    newRepoOrgName: string;
    newRepoPrivacyType: "public" | "private";
    existingRepo: {
        name: string;
        owner: string;
    };
    userEmail: "";
}

let octokit: Octokit;
let user: Await<ReturnType<typeof octokit.rest.users.getAuthenticated>>["data"];
let repo: Await<ReturnType<typeof octokit.rest.repos.createForAuthenticatedUser>>["data"];

const NEW_TOKEN_URL =
    "https://github.com/settings/tokens/new?scopes=repo,workflow&description=webiny-cicd-token";

const LONG_LIVED_BRANCHES = ["dev", "staging", "prod"];

let generateErrorsCount = 0;

const plugin: CliPluginsScaffoldCi<GithubActionsInput> = {
    type: "cli-plugin-scaffold-ci",
    name: "cli-plugin-scaffold-ci-github",
    provider: "githubActions",
    questions: () => {
        return [
            {
                name: "githubAccessTokenCreate",
                message: () => {
                    return `In order to proceed, you will need a GitHub personal access token. Do you want to create a new one?`;
                },
                type: "list",
                default: true,
                choices: async () => {
                    return [
                        {
                            name: "No, I already have my GitHub personal access token",
                            value: false
                        },
                        {
                            name: "Yes, I want to create a new GitHub personal access token",
                            value: true
                        }
                    ];
                }
            },
            {
                name: "githubAccessToken",
                type: "password",
                message: () => {
                    return `Your GitHub personal access token:`;
                },
                required: true,
                when: (answers: GithubActionsInput) => {
                    answers.githubAccessTokenCreate && open(NEW_TOKEN_URL);
                    return true;
                },
                validate: async (answer: GithubActionsInput) => {
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
                name: "userEmail",
                message:
                    "Please enter your e-mail address (will be used ONLY upon making git commits): ",
                required: true,
                when: () => !user.email,
                type: "input",
                validate: answer => {
                    try {
                        validation.validateSync(answer, "email");
                        return true;
                    } catch (e) {
                        return e.message;
                    }
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
                when: (answers: GithubActionsInput) => answers.newOrExistingRepo === "newRepo",
                message:
                    "Select an organization within which the new repository will be created (optional):",
                type: "list",
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
                when: (answers: GithubActionsInput) => answers.newOrExistingRepo === "newRepo",
                validate: async (answer: string, answers: GithubActionsInput) => {
                    const repositories = await fetchAllRepositories({ octokit });
                    for (let i = 0; i < repositories.length; i++) {
                        const repository = repositories[i];
                        const owner = answers.newRepoOrgName || user.login;
                        if (repository.name === answer && repository.owner.login === owner) {
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
                when: (answers: GithubActionsInput) => answers.newOrExistingRepo === "newRepo",
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
                when: (answers: GithubActionsInput) => answers.newOrExistingRepo === "existingRepo",
                type: "list",
                choices: async () => {
                    return fetchAllRepositories({ octokit }).then(repositories =>
                        repositories.map(repository => ({
                            name: repository.full_name,
                            value: {
                                name: repository.name,
                                owner: repository.owner.login
                            }
                        }))
                    );
                }
            }
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
            `- push GitHub Actions workflow files (located in ${chalk.green(".github/workflows")})`
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
        const { newRepoName, newRepoOrgName, existingRepo, newRepoPrivacyType, userEmail } = input;

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
            /**
             * TODO @ts-refactor try to get the heads and tails of this.
             */
            // @ts-expect-error
            repo = await octokit.rest.repos
                .get({
                    repo: existingRepo.name,
                    owner: existingRepo.owner
                })
                .then(response => response.data);
        }

        // 2. Let's commit GitHub Actions workflows.
        ora.start(`Creating GitHub Actions workflows...`);
        try {
            await commitWorkflows({
                octokit,
                owner: repo.owner.login,
                repo: repo.name,
                branch: repo.default_branch,
                author: {
                    name: user.name as string,
                    email: userEmail || (user.email as string)
                }
            });

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `GitHub Actions workflows created.`
            });
        } catch (e) {
            generateErrorsCount++;
            ora.stopAndPersist({
                symbol: chalk.red("✘"),
                text: `Creation of GitHub Actions workflows failed with the following message: ${e.message}`
            });

            console.log(chalk.red("✘") + " Cannot continue, exiting...");
            return;
        }

        // 3. Create protected (long-lived) branches.
        ora.start(
            `Creating long-lived ${chalk.green("dev")}, ${chalk.green(
                "staging"
            )}, and ${chalk.green("prod")} branches...`
        );

        try {
            const latestCommitSha = await octokit.rest.git
                .getRef({
                    owner: repo.owner.login,
                    repo: repo.name,
                    ref: `heads/${repo.default_branch}`
                })
                .then(({ data }) => data.object.sha);

            for (let i = 0; i < LONG_LIVED_BRANCHES.length; i++) {
                const longLivedBranch = LONG_LIVED_BRANCHES[i];
                await octokit.rest.git.createRef({
                    owner: repo.owner.login,
                    repo: repo.name,
                    ref: `refs/heads/${longLivedBranch}`,
                    sha: latestCommitSha
                });
            }

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Long-lived ${chalk.green("dev")}, ${chalk.green(
                    "staging"
                )}, and ${chalk.green("prod")} branches created.`
            });
        } catch (e) {
            generateErrorsCount++;
            ora.stopAndPersist({
                symbol: chalk.red("✘"),
                text: `Creation of long-lived ${chalk.green("dev")}, ${chalk.green(
                    "staging"
                )}, and ${chalk.green("prod")} branches failed with the following message: ${
                    e.message
                }`
            });
        }

        // 4. Protecting branches...
        ora.start(`Enabling protection for created long-lived branches...`);

        try {
            for (let i = 0; i < LONG_LIVED_BRANCHES.length; i++) {
                const longLivedBranch = LONG_LIVED_BRANCHES[i];
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
            generateErrorsCount++;
            ora.stopAndPersist({
                symbol: chalk.red("✘"),
                text: `Enabling protection for long-lived branches failed with the following message: ${e.message}`
            });
        }

        // 5. Make "dev" branch the default one.
        ora.start(`Setting ${chalk.green("dev")} as the default branch.`);

        try {
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
        } catch (e) {
            generateErrorsCount++;
            ora.stopAndPersist({
                symbol: chalk.red("✘"),
                text: `Setting ${chalk.green(
                    "dev"
                )} as the default branch failed with the following message: ${e.message}`
            });
        }
    },
    onSuccess: async () => {
        console.log();

        if (generateErrorsCount) {
            console.log(
                `${chalk.yellow("✔")} CI/CD partially set up (total errors: ${chalk.yellow(
                    generateErrorsCount
                )}).`
            );
        } else {
            console.log(`${chalk.green("✔")} CI/CD pipeline successfully set up.`);
        }

        console.log();

        console.log(`Check out the created code repository here:`);
        console.log(repo.html_url);
        console.log();

        const url = "https://www.webiny.com/docs/how-to-guides/scaffolding/ci-cd#next-steps";
        console.log(`For next steps, please open the following link:`);
        console.log(url);
        console.log();

        // On errors, let's not automatically open next steps. Let's let the
        // user see what were the errors. He can still go to next steps because
        // the link is displayed on the screen in any case.
        generateErrorsCount === 0 && open(url);
    }
};

export default plugin;
