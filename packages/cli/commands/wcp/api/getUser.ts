import { localStorage, log } from "@webiny/cli/utils";
import { request } from "graphql-request";
import { WCP_API_URL } from ".";

const GET_USER = /* GraphQL */ `
    query GetUser {
        users {
            getUser {
                firstName
                lastName
                orgs {
                    id
                    name
                }
                projects {
                    id
                    name
                }
            }
        }
    }
`;

let user;
export const getUser = async () => {
    if (user) {
        return user;
    }

    const pat = localStorage().get("wcpPat");
    if (!pat) {
        throw new Error(
            `It seems you are not logged in. Please login using the ${log.error.hl(
                "webiny login"
            )} command.`
        );
    }

    user = await request(WCP_API_URL, GET_USER, {}, { authorization: pat }).then(
        response => response.users.getUser
    );

    return user;
};
