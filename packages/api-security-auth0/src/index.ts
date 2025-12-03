import {
    createGroupsTeamsAuthorizer,
    GroupsTeamsAuthorizerConfig
} from "@webiny/api-core/features/security/utils/createGroupsTeamsAuthorizer.js";

export { createIdentityType } from "./createIdentityType.js";
export { createAuthenticator } from "./createAuthenticator.js";
export type { AuthenticatorConfig } from "./createAuthenticator.js";
export { createAuth0 } from "./createAuth0.js";

export { createGroupsTeamsAuthorizer, type GroupsTeamsAuthorizerConfig };
