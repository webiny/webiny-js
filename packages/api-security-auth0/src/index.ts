import {
    createGroupsTeamsAuthorizer,
    type GroupsTeamsAuthorizerConfig
} from "@webiny/api-security";

export { createIdentityType } from "./createIdentityType";
export { createAuthenticator } from "./createAuthenticator";
export type { AuthenticatorConfig } from "./createAuthenticator";
export { createAuth0 } from "./createAuth0";

export { createGroupsTeamsAuthorizer, type GroupsTeamsAuthorizerConfig };

// Backwards compatibility.
// @deprecated Use `createGroupsTeamsAuthorizer` instead.
const createGroupAuthorizer = createGroupsTeamsAuthorizer;

// @deprecated Use `GroupsTeamsAuthorizerConfig` instead.
type GroupAuthorizerConfig = GroupsTeamsAuthorizerConfig;

export { createGroupAuthorizer, type GroupAuthorizerConfig };
