const { request } = require("graphql-request");
const { localStorage, log } = require("@webiny/cli/utils");

const UPDATE_LAST_ACTIVE_TO_NOW = /* GraphQL */ `
    mutation UpdateLastActiveToNow {
        users {
            updateLastActiveToNow {
                id
                lastActiveOn
            }
        }
    }
`;

module.exports.updateUserLastActiveOn = async () => {
    const pat = localStorage().get("wcpPat");
    if (!pat) {
        throw new Error(
            `It seems you are not logged in. Please login using the ${log.error.hl(
                "webiny login"
            )} command.`
        );
    }

    const { WCP_GRAPHQL_API_URL } = require(".");
    const headers = { authorization: pat };
    return request(WCP_GRAPHQL_API_URL, UPDATE_LAST_ACTIVE_TO_NOW, {}, headers);
};
