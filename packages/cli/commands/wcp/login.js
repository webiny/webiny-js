import open from "open";
import { GraphQLClient } from "graphql-request";
import { WCP_API_URL, WCP_APP_URL } from "./api";

// 120 retries * 2000ms interval = 4 minutes until the command returns an error.
const LOGIN_RETRIES_COUNT = 30;
const LOGIN_RETRIES_INTERVAL = 2000;

const GENERATE_PERSONAL_ACCESS_TOKEN = /* GraphQL */ `
    mutation {
        users {
            generatePersonalAccessToken
        }
    }
`;
const GET_PERSONAL_ACCESS_TOKEN = /* GraphQL */ `
    query GetPersonalAccessToken($token: ID!) {
        users {
            getPersonalAccessToken(token: $token) {
                name
                user {
                    email
                }
            }
        }
    }
`;

export default () => ({
    type: "cli-command",
    name: "cli-command-wcp-login",
    create({ yargs, context }) {
        yargs.command(
            "login",
            `Log in to the Webiny Control Panel`,
            yargs => {
                yargs.example("$0 login");
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
            async ({ debug, debugLevel }) => {
                const graphQLClient = new GraphQLClient(WCP_API_URL);
                const token = await graphQLClient
                    .request(GENERATE_PERSONAL_ACCESS_TOKEN)
                    .then(({ users }) => users.generatePersonalAccessToken);

                const queryParams = `?pat=${token}&pat_name=${encodeURIComponent("Webiny CLI")}`;
                const openUrl = WCP_APP_URL + queryParams;

                debug && context.debug(`Opening ${context.debug.hl(openUrl)}...`);
                await open(openUrl);

                const graphql = {
                    variables: { token },
                    headers: {
                        Authorization: token
                    }
                };

                graphQLClient.setHeaders(graphql.headers);

                let retries = 0;
                const result = await new Promise(resolve => {
                    setInterval(async () => {
                        retries++;
                        if (retries > LOGIN_RETRIES_COUNT) {
                            resolve(false);
                        }

                        try {
                            await graphQLClient.request(
                                GET_PERSONAL_ACCESS_TOKEN,
                                graphql.variables
                            );
                            resolve(true);
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

                context.localStorage.set("wcpPat", token);

                context.success(`You've successfully logged in to Webiny Control Panel!`);

                const { project } = context;

                if (!project.config.id) {
                    // Show list of all projects.
                    // If no projects, want to create one?
                } else {
                    // Check the project ID as well.
                    // Write "this is project xyz"
                }

                console.log();
                process.exit();
                process.exit(0);
            }
        );

        yargs.command(
            "logout",
            `Log out from the Webiny Control Panel`,
            yargs => {
                yargs.example("$0 login");
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
            async () => {
                context.info(`You've successfully logged out from Webiny Control Panel.`);

                context.localStorage.set("wcpPat", null);
            }
        );

        yargs.command(
            "whoami",
            `Display the current logged-in user`,
            yargs => {
                yargs.example("$0 login");
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
            async ({ debug }) => {
                const pat = context.localStorage.get("wcpPat");
                if (!pat) {
                    throw new Error(
                        `It seems you are not logged in. Please login using the ${context.error.hl(
                            "webiny login"
                        )} command.`
                    );
                }

                const graphQLClient = new GraphQLClient(WCP_API_URL);
                graphQLClient.setHeaders({ authorization: pat });

                try {
                    const user = await graphQLClient
                        .request(GET_PERSONAL_ACCESS_TOKEN, { token: pat })
                        .then(({ users }) => users.getPersonalAccessToken.user);

                    context.info(
                        `You are logged in to Webiny Control Panel as ${context.info.hl(
                            user.email
                        )}.`
                    );
                } catch (e) {
                    if (debug) {
                        context.debug(e);
                    }
                    throw new Error(
                        `It seems you are not logged in. Please login using the ${context.error.hl(
                            "webiny login"
                        )} command.`
                    );
                }
            }
        );
    }
});
