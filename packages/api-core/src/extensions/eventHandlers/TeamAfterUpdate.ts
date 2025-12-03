import { defineApiExtension } from "@webiny/project/defineExtension";
import { TeamAfterUpdateHandler } from "~/features/security/teams/UpdateTeam/index.js";

export const TeamAfterUpdate = defineApiExtension({
    type: "Security/TeamAfterUpdate",
    description: "Add custom logic to be executed after a team is updated.",
    abstraction: TeamAfterUpdateHandler
});
