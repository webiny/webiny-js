const { GraphQLClient } = require("graphql-request");
const { WCP_API_URL, getWcpPat } = require("./utils");

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

module.exports = () => ({
    type: "cli-command",
    name: "cli-command-wcp-whoami",
    create({ yargs, context }) {
        yargs.command(
            "whoami",
            `Display the current logged-in user`,
            yargs => {
                yargs.example("$0 whoami");
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
                const pat = getWcpPat();
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
                        .request(GET_USER_PAT, { token: pat })
                        .then(({ users }) => users.getUserPat.user);

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
