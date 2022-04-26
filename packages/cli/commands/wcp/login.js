const open = require("open");
const { GraphQLClient } = require("graphql-request");
const { WCP_GRAPHQL_API_URL, WCP_APP_URL, setProjectId, setWcpPat, sleep } = require("./utils");
const chalk = require("chalk");

// 120 retries * 2000ms interval = 4 minutes until the command returns an error.
const LOGIN_RETRIES_COUNT = 30;
const LOGIN_RETRIES_INTERVAL = 2000;

const USER_PAT_FIELDS = /* GraphQL */ `
    fragment UserPatFields on UserPat {
        name
        meta
        token
        expiresOn
        user {
            email
        }
    }
`;

const GENERATE_USER_PAT = /* GraphQL */ `
    mutation GenerateUserPat {
        users {
            generateUserPat
        }
    }
`;

const GET_USER_PAT = /* GraphQL */ `
    ${USER_PAT_FIELDS}
    query GetUserPat($token: ID!) {
        users {
            getUserPat(token: $token) {
                ...UserPatFields
            }
        }
    }
`;

const CREATE_USER_PAT = /* GraphQL */ `
    ${USER_PAT_FIELDS}
    mutation CreateUserPat($expiresIn: Int, $token: ID, $data: CreateUserPatDataInput) {
        users {
            createUserPat(expiresIn: $expiresIn, token: $token, data: $data) {
                ...UserPatFields
            }
        }
    }
`;

module.exports.command = () => ({
    type: "cli-command",
    name: "cli-command-wcp-login",
    create({ yargs, context }) {
        yargs.command(
            "login [pat]",
            `Log in to the Webiny Control Panel`,
            yargs => {
                yargs.example("$0 login");
                yargs.positional("pat", {
                    describe: `Personal access token (PAT)`,
                    type: "string"
                });
                yargs.option("debug", {
                    describe: `Turn on debug logs`,
                    type: "boolean"
                });
                yargs.option("debug-level", {
                    default: 1,
                    describe: `Set the debug logs verbosity level`,
                    type: "number"
                });
            },
            async ({ debug, debugLevel, pat: patFromParams }) => {
                const graphQLClient = new GraphQLClient(WCP_GRAPHQL_API_URL);

                let pat;

                if (patFromParams) {
                    try {
                        graphQLClient.setHeaders({ authorization: patFromParams });
                        pat = await graphQLClient
                            .request(GET_USER_PAT, { token: patFromParams })
                            .then(({ users }) => users.getUserPat);

                        // If we've received a PAT that has expiration, let's create a long-lived PAT.
                        // We don't want to have our users interrupted because of an expired PAT.
                        if (pat.expiresOn) {
                            pat = await graphQLClient
                                .request(CREATE_USER_PAT, { data: { meta: pat.meta } })
                                .then(({ users }) => users.createUserPat);
                        }
                    } catch (e) {
                        if (debug) {
                            context.debug(
                                `Could not use the provided ${context.debug.hl(
                                    patFromParams
                                )} PAT because of the following error:`
                            );
                            console.debug(e);
                        }

                        throw new Error(
                            `Invalid PAT received. Please try again or login manually via the ${context.error.hl(
                                "yarn webiny login"
                            )} command.`
                        );
                    }
                } else {
                    const generatedPat = await graphQLClient
                        .request(GENERATE_USER_PAT)
                        .then(({ users }) => users.generateUserPat);

                    const queryParams = `pat=${generatedPat}&pat_name=${encodeURIComponent(
                        "Webiny CLI"
                    )}&ref=cli`;
                    const openUrl = `${WCP_APP_URL}/login/cli?${queryParams}`;

                    debug && context.debug(`Opening ${context.debug.hl(openUrl)}...`);
                    await open(openUrl);

                    const graphql = {
                        variables: { token: generatedPat },
                        headers: {
                            Authorization: generatedPat
                        }
                    };

                    graphQLClient.setHeaders(graphql.headers);

                    let retries = 0;
                    const result = await new Promise(resolve => {
                        const interval = setInterval(async () => {
                            retries++;
                            if (retries > LOGIN_RETRIES_COUNT) {
                                clearInterval(interval);
                                resolve(null);
                            }

                            try {
                                const pat = await graphQLClient
                                    .request(GET_USER_PAT, graphql.variables)
                                    .then(({ users }) => users.getUserPat);

                                clearInterval(interval);
                                resolve(pat);
                            } catch (e) {
                                // Do nothing.
                                if (debug) {
                                    context.debug(
                                        `Could not login. Will try again in ${LOGIN_RETRIES_INTERVAL}ms.`
                                    );
                                    if (debugLevel > 1) {
                                        context.debug("GraphQL Request: ");
                                        console.log(JSON.stringify(graphql, null, 2));
                                    }
                                    if (debugLevel > 2) {
                                        context.debug(e.message);
                                    }
                                }
                            }
                        }, LOGIN_RETRIES_INTERVAL);
                    });

                    if (!result) {
                        throw new Error(
                            `Could not login. Did you complete the sign in / sign up process at ${WCP_APP_URL}?`
                        );
                    }

                    pat = result;
                }

                setWcpPat(pat.token);

                console.log(
                    `${chalk.green("✔")} You've successfully logged in to Webiny Control Panel.`
                );

                let projectInitialized = Boolean(context.project.config.id);

                // If we have `orgId` and `projectId` in PAT's meta data, let's immediately activate the project.
                if (pat.meta && pat.meta.orgId && pat.meta.projectId) {
                    await sleep();

                    console.log();

                    const { orgId, projectId } = pat.meta;

                    const id = `${orgId}/${projectId}`;
                    console.log(`Project ${chalk.green(id)} detected. Initializing...`);

                    await sleep();

                    await setProjectId({
                        project: context.project,
                        orgId,
                        projectId
                    });

                    console.log(`Project ${context.success.hl(id)} initialized successfully.`);
                    projectInitialized = true;
                }

                await sleep();

                console.log();
                console.log(chalk.bold("Next Steps"));

                if (!projectInitialized) {
                    console.log(
                        `‣ initialize your project via the ${chalk.green(
                            "yarn webiny project init"
                        )} command`
                    );
                }

                console.log(
                    `‣ deploy your project via the ${chalk.green("yarn webiny deploy")} command`
                );
            }
        );
    }
});
