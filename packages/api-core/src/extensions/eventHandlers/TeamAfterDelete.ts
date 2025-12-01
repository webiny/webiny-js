import { defineApiExtension } from "@webiny/project/defineExtension";
import { TeamAfterDeleteHandler } from "~/features/security/teams/DeleteTeam/index.js";

export const TeamAfterDelete = defineApiExtension({
    type: "Security/TeamAfterDelete",
    description: "Add custom logic to be executed after a team is deleted.",
    abstraction: TeamAfterDeleteHandler
});
