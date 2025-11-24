import { defineApiExtension } from "@webiny/project/defineExtension";
import { TeamBeforeDeleteHandler } from "~/features/security/teams/DeleteTeam/index.js";

export const TeamBeforeDelete = defineApiExtension({
    type: "Security/TeamBeforeDelete",
    description: "Add custom logic to be executed before a team is deleted.",
    abstraction: TeamBeforeDeleteHandler
});
