import base from "./base.gql.js";
import apiKey from "./apiKey.gql.js";
import role from "./role.gql.js";
import team from "./team.gql.js";
import identity from "./identity.gql.js";

export const createSecurityGraphQL = () => {
    return [base, team, apiKey, role, identity];
};
