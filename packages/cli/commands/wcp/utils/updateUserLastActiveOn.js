const { request } = require("graphql-request");
const { localStorage, log } = require("@webiny/cli/utils");
const { getWcpGqlApiUrl } = require("@webiny/wcp");

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

    const headers = { authorization: pat };
    return request(getWcpGqlApiUrl(), UPDATE_LAST_ACTIVE_TO_NOW, {}, headers);
};
