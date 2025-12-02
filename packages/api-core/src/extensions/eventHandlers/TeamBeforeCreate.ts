import { defineApiExtension } from "@webiny/project/defineExtension";
import { TeamBeforeCreateHandler } from "~/features/security/teams/CreateTeam/index.js";

export const TeamBeforeCreate = defineApiExtension({
    type: "Security/TeamBeforeCreate",
    description: "Add custom logic to be executed before a team is created.",
    abstraction: TeamBeforeCreateHandler
});
