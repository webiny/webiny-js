const { log } = require("@webiny/cli/utils");
const { request } = require("graphql-request");
const { getWcpPat } = require("./getWcpPat");
const { getWcpGqlApiUrl } = require("@webiny/wcp");

const GET_CURRENT_USER = /* GraphQL */ `
    query GetUser {
        users {
            getCurrentUser {
                id
                email
                firstName
                lastName
            }
        }
    }
`;

const LIST_ORGS = /* GraphQL */ `
    query ListOrgs {
        orgs {
            listOrgs {
                data {
                    id
                    name
                }
            }
        }
    }
`;

const LIST_PROJECTS = /* GraphQL */ `
    query ListProjects($orgId: ID!) {
        projects {
            listProjects(orgId: $orgId) {
                data {
                    id
                    name
                    org {
                        id
                        name
                    }
                }
            }
        }
    }
`;

let user;
module.exports.getUser = async () => {
    if (user) {
        return user;
    }

    const pat = getWcpPat();
    if (!pat) {
        throw new Error(
            `It seems you are not logged into your WCP project. Please log in using the ${log.error.hl(
                "yarn webiny login"
            )} command. If you are not using WCP, make sure you don't have an "id" property in your "webiny.project.ts" file.`
        );
    }

    try {
        const headers = { authorization: pat };
        user = await request(getWcpGqlApiUrl(), GET_CURRENT_USER, {}, headers).then(
            async response => {
                const user = response.users.getCurrentUser;

                const orgs = await request(getWcpGqlApiUrl(), LIST_ORGS, {}, headers).then(
                    async response => {
                        const orgs = response.orgs.listOrgs.data;
                        for (let i = 0; i < orgs.length; i++) {
                            const org = orgs[i];
                            org.projects = await request(
                                getWcpGqlApiUrl(),
                                LIST_PROJECTS,
                                { orgId: org.id },
                                headers
                            ).then(response => response.projects.listProjects.data);
                        }
                        return orgs;
                    }
                );

                const projects = orgs.map(org => org.projects).flat();

                return { ...user, orgs, projects };
            }
        );
    } catch {
        throw new Error(
            `It seems the personal access token is incorrect or does not exist. Please log out and log in again using the ${log.error.hl(
                "yarn webiny login"
            )} command.`
        );
    }

    return user;
};
