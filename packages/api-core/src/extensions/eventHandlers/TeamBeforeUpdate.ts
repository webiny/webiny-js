import { defineApiExtension } from "@webiny/project/defineExtension";
import { TeamBeforeUpdateHandler } from "~/features/security/teams/UpdateTeam/index.js";

export const TeamBeforeUpdate = defineApiExtension({
    type: "Security/TeamBeforeUpdate",
    description: "Add custom logic to be executed before a team is updated.",
    abstraction: TeamBeforeUpdateHandler
});
