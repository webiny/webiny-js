import { createFeature } from "@webiny/feature/api";
import { GroupsTeamsAuthorizer } from "./GroupsTeamsAuthorizer.js";
import { GetPermissionsFromGroupsAndTeams } from "./GetPermissionsFromGroupsAndTeams.js";

export const GroupsTeamsAuthorizerFeature = createFeature({
    name: "GroupsTeamsAuthorizer",
    register(container) {
        container.register(GroupsTeamsAuthorizer).inSingletonScope();
        container.register(GetPermissionsFromGroupsAndTeams);
    }
});
