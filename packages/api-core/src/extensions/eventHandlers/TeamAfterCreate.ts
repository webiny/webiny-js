import { defineApiExtension } from "@webiny/project/defineExtension";
import { TeamAfterCreateHandler } from "~/features/security/teams/CreateTeam/index.js";

export const TeamAfterCreate = defineApiExtension({
    type: "Security/TeamAfterCreate",
    description: "Add custom logic to be executed after a team is created.",
    abstraction: TeamAfterCreateHandler
});
