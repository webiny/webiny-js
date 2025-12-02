import {
    createGroupsTeamsAuthorizer,
    GroupsTeamsAuthorizerConfig
} from "@webiny/api-core/features/security/utils/createGroupsTeamsAuthorizer.js";

export { createIdentityType } from "./createIdentityType.js";
export { createAuthenticator } from "./createAuthenticator.js";
export type { AuthenticatorConfig } from "./createAuthenticator.js";
export { createOkta } from "./createOkta.js";

export { createGroupsTeamsAuthorizer, type GroupsTeamsAuthorizerConfig };
