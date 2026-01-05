import { createFeature } from "@webiny/feature/api";
import { RolesTeamsAuthorizer } from "./RolesTeamsAuthorizer.js";
import { GetPermissionsFromIdentity } from "./GetPermissionsFromIdentity.js";

export const GroupsTeamsAuthorizerFeature = createFeature({
    name: "GroupsTeamsAuthorizer",
    register(container) {
        container.register(RolesTeamsAuthorizer).inSingletonScope();
        container.register(GetPermissionsFromIdentity);
    }
});
